package com.landhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "agents")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Agent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "agency_name", length = 120)
    private String agencyName;

    @Column(name = "licence_no", length = 40)
    private String licenceNo;

    @Column(name = "service_districts", length = 255)
    private String serviceDistricts;

    @Column(name = "commission_pct", precision = 5, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal commissionPct = new BigDecimal("2.50");
}
