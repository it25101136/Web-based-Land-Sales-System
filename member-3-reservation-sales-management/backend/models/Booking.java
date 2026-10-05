package models;

import models.BookingStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings", indexes = {
    @Index(name = "idx_bookings_land", columnList = "land_id"),
    @Index(name = "idx_bookings_buyer", columnList = "buyer_id"),
    @Index(name = "idx_bookings_seller", columnList = "seller_id"),
    @Index(name = "idx_bookings_status", columnList = "status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "land_id", nullable = false)
    private Long landId;

    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(name = "buyer_name", nullable = false, length = 80)
    private String buyerName;

    @Column(name = "contact_no", nullable = false, length = 20)
    private String contactNo;

    @Column(nullable = false, length = 120)
    private String email;

    @Column(name = "preferred_date")
    private LocalDate preferredDate;

    @Column(length = 800)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

