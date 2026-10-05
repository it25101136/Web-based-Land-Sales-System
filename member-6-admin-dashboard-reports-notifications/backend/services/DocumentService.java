package services;

import models.*;
import models.*;
import com.landhub.exception.ApiException;
import data.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final LandDocumentRepository docRepo;
    private final LandRepository landRepo;
    private final UserRepository userRepo;
    private final NotificationService notificationService;

    @Transactional
    public Map<String, Object> upload(Long userId, Map<String, Object> dto) {
        Long landId = toLong(dto.get("land_id"));
        Land land = landRepo.findById(landId).orElseThrow(() -> ApiException.notFound("Land listing not found"));

        if (!land.getSellerId().equals(userId))
            throw ApiException.forbidden("You can only upload documents for your own listings");

        LandDocument doc = docRepo.save(LandDocument.builder()
                .landId(landId).uploadedBy(userId)
                .docType(DocType.valueOf((String) dto.get("doc_type")))
                .fileName((String) dto.get("file_name"))
                .build());

        return docToMap(doc);
    }

    @Transactional
    public Map<String, Object> review(Long docId, Long adminId, String status, String remarks) {
        LandDocument doc = docRepo.findById(docId).orElseThrow(() -> ApiException.notFound("Document not found"));
        doc.setStatus(Verification.valueOf(status.toUpperCase()));
        doc.setRemarks(remarks);
        doc.setReviewedBy(adminId);
        doc.setReviewedAt(LocalDateTime.now());
        docRepo.save(doc);

        // Auto-compute land verification: need both DEED and SURVEY_PLAN verified
        List<LandDocument> docs = docRepo.findByLandIdOrderByCreatedAtDesc(doc.getLandId());
        boolean hasDeed = docs.stream().anyMatch(d -> d.getDocType() == DocType.DEED && d.getStatus() == Verification.VERIFIED);
        boolean hasPlan = docs.stream().anyMatch(d -> d.getDocType() == DocType.SURVEY_PLAN && d.getStatus() == Verification.VERIFIED);
        Verification landVerification = (hasDeed && hasPlan) ? Verification.VERIFIED : Verification.PENDING;

        Land land = landRepo.findById(doc.getLandId()).orElse(null);
        if (land != null) {
            land.setVerification(landVerification);
            landRepo.save(land);
        }

        notificationService.push(doc.getUploadedBy(), "DOCUMENT_REVIEWED", "Document reviewed",
                "Your " + doc.getDocType().name() + " has been " + doc.getStatus().name().toLowerCase() + ".", "/seller");

        Map<String, Object> m = docToMap(doc);
        m.put("land_verification", landVerification.name());
        return m;
    }

    public List<Map<String, Object>> pending() {
        return docRepo.findByStatusOrderByCreatedAtAsc(Verification.PENDING).stream().map(this::docToMap).toList();
    }

    public List<Map<String, Object>> forLand(Long landId) {
        return docRepo.findByLandIdOrderByCreatedAtDesc(landId).stream().map(this::docToMap).toList();
    }

    public List<Map<String, Object>> mine(Long userId) {
        return docRepo.findByUploadedByOrderByCreatedAtDesc(userId).stream().map(this::docToMap).toList();
    }

    public List<Map<String, Object>> all() {
        return docRepo.findAllByOrderByCreatedAtDesc().stream().map(this::docToMap).toList();
    }

    public Map<String, Object> types() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("types", Arrays.stream(DocType.values()).map(DocType::name).toList());
        m.put("disclaimer", "Document verification on LandHub is not legal certification. " +
                "Always consult a qualified attorney before any property transaction.");
        return m;
    }

    private Map<String, Object> docToMap(LandDocument d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("land_id", d.getLandId());
        m.put("uploaded_by", d.getUploadedBy());
        m.put("doc_type", d.getDocType().name());
        m.put("file_name", d.getFileName() != null ? d.getFileName() : "");
        m.put("status", d.getStatus().name());
        m.put("remarks", d.getRemarks());
        m.put("reviewed_by", d.getReviewedBy());
        m.put("created_at", d.getCreatedAt() != null ? d.getCreatedAt().toString() : "");

        Land land = landRepo.findById(d.getLandId()).orElse(null);
        m.put("land_title", land != null ? land.getTitle() : "Listing #" + d.getLandId());
        m.put("district", land != null ? land.getDistrict() : "");
        userRepo.findById(d.getUploadedBy()).ifPresent(u -> m.put("uploader_name", u.getFullName()));
        m.putIfAbsent("uploader_name", "User #" + d.getUploadedBy());

        return m;
    }

    private static long toLong(Object v) { if (v == null) return 0; if (v instanceof Number n) return n.longValue(); try { return Long.parseLong(v.toString()); } catch (Exception e) { return 0; } }
}

