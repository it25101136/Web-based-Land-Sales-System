package models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "wishlist", uniqueConstraints = {
    @UniqueConstraint(name = "uq_wishlist", columnNames = {"user_id", "land_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Wishlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "land_id", nullable = false)
    private Long landId;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

