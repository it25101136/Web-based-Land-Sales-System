package models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recently_viewed", uniqueConstraints = {
    @UniqueConstraint(name = "uq_recent", columnNames = {"user_id", "land_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecentlyViewed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "land_id", nullable = false)
    private Long landId;

    @Column(name = "viewed_at", nullable = false)
    @Builder.Default
    private LocalDateTime viewedAt = LocalDateTime.now();
}

