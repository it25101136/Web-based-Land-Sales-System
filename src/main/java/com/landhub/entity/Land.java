package com.landhub.entity;

import com.landhub.entity.enums.LandStatus;
import com.landhub.entity.enums.LandType;
import com.landhub.entity.enums.Verification;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "lands", indexes = {
    @Index(name = "idx_lands_seller", columnList = "seller_id"),
    @Index(name = "idx_lands_district", columnList = "district"),
    @Index(name = "idx_lands_province", columnList = "province"),
    @Index(name = "idx_lands_price", columnList = "price"),
    @Index(name = "idx_lands_type", columnList = "land_type"),
    @Index(name = "idx_lands_status", columnList = "status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Land {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(name = "agent_id")
    private Long agentId;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "title_si", length = 200)
    private String titleSi;

    @Column(name = "title_ta", length = 200)
    private String titleTa;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "land_type", nullable = false)
    private LandType landType;

    @Column(nullable = false, length = 40)
    private String province;

    @Column(nullable = false, length = 40)
    private String district;

    @Column(nullable = false, length = 60)
    private String city;

    @Column(length = 80)
    private String area;

    @Column(length = 200)
    private String address;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal perches;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "price_per_perch", nullable = false, precision = 15, scale = 2)
    private BigDecimal pricePerPerch;

    @Column(nullable = false)
    @Builder.Default
    private Boolean negotiable = false;

    @Column(precision = 10, scale = 7)
    private BigDecimal lat;

    @Column(precision = 10, scale = 7)
    private BigDecimal lng;

    @Column(nullable = false) @Builder.Default private Boolean electricity = false;
    @Column(nullable = false) @Builder.Default private Boolean water = false;
    @Column(name = "main_road", nullable = false) @Builder.Default private Boolean mainRoad = false;
    @Column(nullable = false) @Builder.Default private Boolean internet = false;
    @Column(nullable = false) @Builder.Default private Boolean telephone = false;
    @Column(nullable = false) @Builder.Default private Boolean drainage = false;
    @Column(name = "clear_deed", nullable = false) @Builder.Default private Boolean clearDeed = false;
    @Column(name = "survey_plan", nullable = false) @Builder.Default private Boolean surveyPlan = false;
    @Column(name = "near_school", nullable = false) @Builder.Default private Boolean nearSchool = false;
    @Column(name = "near_hospital", nullable = false) @Builder.Default private Boolean nearHospital = false;
    @Column(name = "near_highway", nullable = false) @Builder.Default private Boolean nearHighway = false;
    @Column(name = "near_railway", nullable = false) @Builder.Default private Boolean nearRailway = false;

    @Column(name = "nearest_highway", length = 60)
    private String nearestHighway;

    @Column(columnDefinition = "JSON")
    private String nearby;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private LandStatus status = LandStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Verification verification = Verification.PENDING;

    @Column(nullable = false)
    @Builder.Default
    private Integer views = 0;

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
