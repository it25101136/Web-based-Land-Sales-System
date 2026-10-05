package com.landhub.service;

import com.landhub.entity.Land;
import com.landhub.entity.LandImage;
import com.landhub.entity.Message;
import com.landhub.entity.User;
import com.landhub.exception.ApiException;
import com.landhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepo;
    private final UserRepository userRepo;
    private final LandRepository landRepo;
    private final LandImageRepository landImageRepo;
    private final NotificationService notificationService;

    @Transactional
    public Map<String, Object> send(Long senderId, Map<String, Object> dto) {
        Long receiverId = toLong(dto.get("receiver_id"));
        Long landId = dto.get("land_id") != null ? toLong(dto.get("land_id")) : null;
        String body = (String) dto.get("body");

        if (senderId.equals(receiverId)) throw ApiException.badRequest("You cannot message yourself");
        if (body == null || body.isBlank()) throw ApiException.badRequest("Message body is required");

        User sender = userRepo.findById(senderId).orElseThrow(() -> ApiException.notFound("Sender not found"));
        userRepo.findById(receiverId).orElseThrow(() -> ApiException.notFound("Recipient not found"));

        long a = Math.min(senderId, receiverId), b = Math.max(senderId, receiverId);
        String conv = (landId != null ? landId : 0) + ":" + a + ":" + b;

        Message msg = messageRepo.save(Message.builder()
                .conversation(conv)
                .landId(landId)
                .senderId(senderId)
                .receiverId(receiverId)
                .body(body.trim())
                .isRead(false)
                .edited(false)
                .deleted(false)
                .createdAt(LocalDateTime.now())
                .build());

        String snippet = body.trim().length() > 60 ? body.trim().substring(0, 60) + "..." : body.trim();
        notificationService.push(receiverId, "MESSAGE_NEW", "New message",
                sender.getFullName() + ": " + snippet, "/messages");

        return messageToMap(msg);
    }

    public Map<String, Object> getConversations(Long userId) {
        List<Object[]> rows = messageRepo.findConversationsForUser(userId);
        int totalUnread = 0;
        List<Map<String, Object>> items = new ArrayList<>();

        for (Object[] r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            String conv = (String) r[0];
            m.put("conversation", conv);
            m.put("last_at", r[1] != null ? r[1].toString() : null);
            m.put("last_body", r[2]);
            m.put("land_id", r[3]);
            int unread = r[4] != null ? ((Number) r[4]).intValue() : 0;
            m.put("unread", unread);
            totalUnread += unread;

            // Determine the other party
            String[] parts = conv.split(":");
            if (parts.length >= 3) {
                long a = Long.parseLong(parts[1]), b = Long.parseLong(parts[2]);
                long otherId = a == userId ? b : a;
                userRepo.findById(otherId).ifPresent(u -> {
                    Map<String, Object> other = new LinkedHashMap<>();
                    other.put("id", u.getId());
                    other.put("full_name", u.getFullName());
                    other.put("role", u.getRole() != null ? u.getRole().name() : null);
                    other.put("avatar", u.getAvatar());
                    m.put("other", other);
                });
            }

            // Land details if land_id present
            if (r[3] != null) {
                Long lid = toLong(r[3]);
                landRepo.findById(lid).ifPresent(l -> {
                    Map<String, Object> lm = new LinkedHashMap<>();
                    lm.put("id", l.getId());
                    lm.put("title", l.getTitle());
                    lm.put("district", l.getDistrict());
                    List<LandImage> imgs = landImageRepo.findByLandIdOrderBySortOrderAsc(l.getId());
                    lm.put("cover", imgs.isEmpty() ? null : imgs.get(0).getUrl());
                    m.put("land", lm);
                });
            }

            items.add(m);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("unread", totalUnread);
        return result;
    }

    @Transactional
    public Map<String, Object> thread(Long userId, Long otherId, Long landId) {
        long a = Math.min(userId, otherId), b = Math.max(userId, otherId);
        String conv = (landId != null ? landId : 0) + ":" + a + ":" + b;

        messageRepo.markReadInConversation(conv, userId);
        List<Message> msgs = messageRepo.findByConversationOrderByIdAsc(conv);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("conversation", conv);
        result.put("items", msgs.stream().map(this::messageToMap).toList());

        userRepo.findById(otherId).ifPresent(u -> {
            Map<String, Object> other = new LinkedHashMap<>();
            other.put("id", u.getId());
            other.put("full_name", u.getFullName());
            other.put("role", u.getRole() != null ? u.getRole().name() : null);
            other.put("avatar", u.getAvatar());
            result.put("other", other);
        });

        return result;
    }

    @Transactional
    public Map<String, Object> edit(Long userId, Long messageId, String newBody) {
        Message msg = messageRepo.findById(messageId)
                .orElseThrow(() -> ApiException.notFound("Message not found"));

        if (!msg.getSenderId().equals(userId)) {
            throw ApiException.forbidden("You can only modify your own messages");
        }
        if (Boolean.TRUE.equals(msg.getDeleted())) {
            throw ApiException.badRequest("Cannot edit a deleted message");
        }
        if (newBody == null || newBody.trim().isBlank()) {
            throw ApiException.badRequest("Message body is required");
        }

        msg.setBody(newBody.trim());
        msg.setEdited(true);
        msg.setEditedAt(LocalDateTime.now());
        messageRepo.save(msg);

        return messageToMap(msg);
    }

    @Transactional
    public Map<String, Object> delete(Long userId, Long messageId) {
        Message msg = messageRepo.findById(messageId)
                .orElseThrow(() -> ApiException.notFound("Message not found"));

        if (!msg.getSenderId().equals(userId)) {
            throw ApiException.forbidden("You can only delete your own messages");
        }
        if (Boolean.TRUE.equals(msg.getDeleted())) {
            throw ApiException.badRequest("Message already deleted");
        }

        msg.setDeleted(true);
        msg.setDeletedAt(LocalDateTime.now());
        messageRepo.save(msg);

        return Map.of("id", msg.getId(), "deleted", true);
    }

    public List<Map<String, Object>> conversations(Long userId) {
        return (List<Map<String, Object>>) getConversations(userId).get("items");
    }

    private Map<String, Object> messageToMap(Message m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        map.put("conversation", m.getConversation());
        map.put("land_id", m.getLandId());
        map.put("sender_id", m.getSenderId());
        map.put("receiver_id", m.getReceiverId());
        map.put("body", Boolean.TRUE.equals(m.getDeleted()) ? "This message was deleted." : m.getBody());
        map.put("is_read", m.getIsRead());
        map.put("edited", Boolean.TRUE.equals(m.getEdited()) ? 1 : 0);
        map.put("edited_at", m.getEditedAt() != null ? m.getEditedAt().toString() : null);
        map.put("deleted", Boolean.TRUE.equals(m.getDeleted()) ? 1 : 0);
        map.put("deleted_at", m.getDeletedAt() != null ? m.getDeletedAt().toString() : null);
        map.put("created_at", m.getCreatedAt() != null ? m.getCreatedAt().toString() : null);
        return map;
    }

    private static long toLong(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (Exception e) { return 0; }
    }
}
