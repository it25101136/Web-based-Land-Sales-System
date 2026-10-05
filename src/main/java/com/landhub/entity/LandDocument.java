package com.landhub.entity;

import com.landhub.entity.enums.DocType;
import com.landhub.entity.enums.Verification;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "land_documents", indexes = {
    @Index(name = "idx_docs_land", columnList = "land_id"),
    @Index(name = "idx_docs_status", columnList = "status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LandDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "land_id", nullable = false)
    private Long landId;

    @Column(name = "uploaded_by", nullable = false)
    private Long uploadedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "doc_type", nullable = false)
    private DocType docType;

    @Column(name = "file_name", nullable = false, length = 160)
    private String fileName;

    @Column(name = "file_path", length = 255)
    private String filePath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Verification status = Verification.PENDING;

    @Column(length = 500)
    private String remarks;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
