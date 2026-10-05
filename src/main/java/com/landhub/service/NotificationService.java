package com.landhub.service;

import com.landhub.entity.Notification;
import com.landhub.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repo;

    public void push(Long userId, String type, String title, String body, String link) {
        repo.save(Notification.builder()
                .userId(userId).type(type).title(title).body(body).link(link)
                .build());
    }

    public List<Notification> list(Long userId, boolean unreadOnly) {
        return unreadOnly ? repo.findByUserIdUnread(userId) : repo.findByUserIdAll(userId);
    }

    public long unreadCount(Long userId) {
        return repo.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markRead(Long userId, Long id) {
        repo.markRead(userId, id);
    }

    @Transactional
    public void markAllRead(Long userId) {
        repo.markAllRead(userId);
    }

    @Transactional
    public void remove(Long userId, Long id) {
        repo.deleteByUserIdAndId(userId, id);
    }
}
