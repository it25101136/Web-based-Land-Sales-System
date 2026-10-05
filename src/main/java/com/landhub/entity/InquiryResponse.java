package com.landhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inquiry_responses", indexes = {
    @Index(name = "idx_inqresp_inquiry", columnList = "inquiry_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InquiryResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "inquiry_id", nullable = false)
    private Long inquiryId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String message;

    @Column(name = "message_type", nullable = false, length = 30)
    @Builder.Default
    private String messageType = "RESPONSE";

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
