package models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "land_images", indexes = {
    @Index(name = "idx_images_land", columnList = "land_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LandImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "land_id", nullable = false)
    private Long landId;

    @Column(nullable = false, length = 255)
    private String url;

    @Column(name = "is_cover", nullable = false)
    @Builder.Default
    private Boolean isCover = false;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}

