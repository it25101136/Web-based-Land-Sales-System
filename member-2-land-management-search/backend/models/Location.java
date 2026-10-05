package models;

import models.LocationLevel;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "locations", indexes = {
    @Index(name = "idx_locations_parent", columnList = "parent_id"),
    @Index(name = "idx_locations_level", columnList = "level")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "name_si", length = 120)
    private String nameSi;

    @Column(name = "name_ta", length = 120)
    private String nameTa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LocationLevel level;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(precision = 10, scale = 7)
    private BigDecimal lat;

    @Column(precision = 10, scale = 7)
    private BigDecimal lng;
}

