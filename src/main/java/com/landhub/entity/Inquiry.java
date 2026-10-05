package com.landhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inquiries", indexes = {
    @Index(name = "idx_inquiries_customer", columnList = "customer_id"),
    @Index(name = "idx_inquiries_status", columnList = "status"),
    @Index(name = "idx_inquiries_staff", columnList = "assigned_staff_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Inquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "land_id")
    private Long landId;

    @Column(nullable = false, length = 150)
    private String subject;

    @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String message;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String category = "GENERAL";

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "OPEN";

    @Column(name = "assigned_staff_id")
    private Long assignedStaffId;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
