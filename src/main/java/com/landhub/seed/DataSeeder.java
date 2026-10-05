package com.landhub.seed;

import com.landhub.entity.*;
import com.landhub.entity.enums.*;
import com.landhub.repository.*;
import com.landhub.util.SriLankaData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final UserRepository userRepo;
    private final BuyerRepository buyerRepo;
    private final SellerRepository sellerRepo;
    private final AgentRepository agentRepo;
    private final LocationRepository locationRepo;
    private final LandRepository landRepo;
    private final LandImageRepository imageRepo;
    private final LandDocumentRepository docRepo;
    private final BookingRepository bookingRepo;
    private final PaymentRepository paymentRepo;
    private final ReviewRepository reviewRepo;
    private final WishlistRepository wishlistRepo;
    private final MessageRepository messageRepo;
    private final NotificationRepository notifRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepo.count() > 0) return;
        log.info("  → Seeding LandHub demo data…");

        String hash = passwordEncoder.encode("Landhub@2026");
        Map<String, Long> ids = new HashMap<>();

        // Users
        String[][] users = {
            {"Admin Nimal Perera", "admin@landhub.lk", "+94 11 234 5678", "ADMIN"},
            {"Sunil Rajapaksha", "sunil@landhub.lk", "+94 77 123 4567", "SELLER"},
            {"Kumari Wijesinghe", "kumari@landhub.lk", "+94 71 987 6543", "SELLER"},
            {"Mohamed Rizwan", "rizwan@landhub.lk", "+94 76 445 2211", "SELLER"},
            {"Thavaraj Sivakumar", "thavaraj@landhub.lk", "+94 75 662 8890", "SELLER"},
            {"Dilani Fernando", "dilani@landhub.lk", "+94 70 334 1122", "BUYER"},
            {"Chathura Bandara", "chathura@landhub.lk", "+94 72 556 7788", "BUYER"},
            {"Ayesha Jayasuriya", "ayesha@landhub.lk", "+94 78 221 3344", "AGENT"}
        };

        for (String[] u : users) {
            User user = userRepo.save(User.builder()
                    .fullName(u[0]).email(u[1]).phone(u[2])
                    .passwordHash(hash).role(Role.valueOf(u[3]))
                    .language(Language.en).build());
            ids.put(u[1], user.getId());

            if ("BUYER".equals(u[3])) buyerRepo.save(Buyer.builder().userId(user.getId()).preferredDistrict("Colombo").budgetMax(BigDecimal.valueOf(15000000)).build());
            if ("SELLER".equals(u[3])) sellerRepo.save(Seller.builder().userId(user.getId()).companyName(u[0].split(" ")[0] + " Lands & Properties").verified(true).build());
            if ("AGENT".equals(u[3])) agentRepo.save(Agent.builder().userId(user.getId()).agencyName("Ceylon Prime Realty").licenceNo("AG-2419").serviceDistricts("Colombo,Gampaha,Kalutara").build());
        }

        // Locations
        for (var entry : SriLankaData.DISTRICTS.entrySet()) {
            Location prov = locationRepo.save(Location.builder().name(entry.getKey()).level(LocationLevel.PROVINCE).build());
            for (String d : entry.getValue()) {
                double[] c = SriLankaData.DISTRICT_COORDS.getOrDefault(d, new double[]{0, 0});
                locationRepo.save(Location.builder().name(d).level(LocationLevel.DISTRICT).parentId(prov.getId())
                        .lat(BigDecimal.valueOf(c[0])).lng(BigDecimal.valueOf(c[1])).build());
            }
        }

        // Lands
        Object[][] lands = {
            {"20 Perch Residential Land for Sale in Piliyandala","Colombo","Piliyandala","Kesbewa Road","Residential",20,9500000,true, "A flat, rectangular 20 perch residential block just 1.2 km from Piliyandala town centre.","Southern Expressway (E01)","VERIFIED",1},
            {"15 Perch Land with Clear Deed in Kadawatha","Gampaha","Kadawatha","Ganemulla Road","Residential",15,7250000,true, "Beautiful 15 perch block in a quiet residential lane off Ganemulla Road, Kadawatha.","Central Expressway (E04)","VERIFIED",2},
            {"30 Perch Land with Hill View in Kandy","Kandy","Kandy","Hantana","Residential",30,12500000,false, "Elevated 30 perch land in Hantana with a panoramic view over the Kandy valley.",null,"VERIFIED",7},
            {"25 Perch Land Close to Galle Fort","Galle","Galle","Dangedara","Residential",25,8750000,true, "A 25 perch block in Dangedara, only 2.5 km from the historic Galle Fort.","Southern Expressway (E01)","VERIFIED",3},
            {"Beachfront Bare Land 40 Perches in Hikkaduwa","Galle","Hikkaduwa","Narigama","Beach",40,34000000,false, "Rare 40 perch beachfront property at Narigama, Hikkaduwa.","Southern Expressway (E01)","VERIFIED",3},
            {"2 Acre Tea Land in Nuwara Eliya","Nuwara Eliya","Talawakele","Lindula","Tea",320,28000000,true, "Two acres of mature VP tea in Lindula, Talawakele.",null,"PENDING",2},
            {"1 Acre Coconut Land in Kurunegala","Kurunegala","Wariyapola","Sirambiyadiya","Coconut",160,11200000,true, "One acre coconut land with 68 bearing palms.",null,"VERIFIED",4},
            {"Commercial Land 18 Perches on Main Road, Malabe","Colombo","Malabe","Kaduwela Road","Commercial",18,25200000,false, "Prime 18 perch commercial land with 45 ft frontage on Kaduwela Road.","Outer Circular Expressway (E02)","VERIFIED",5},
            {"3 Acre Paddy Land in Anuradhapura","Anuradhapura","Thambuttegama","Eppawala Road","Paddy",480,9600000,true, "Three acres of fertile paddy land under the Rajangana irrigation scheme.",null,"PENDING",6},
            {"12.5 Perch Land in Maharagama Town","Colombo","Maharagama","Pamunuwa","Residential",12.5,8125000,false, "Compact 12.5 perch block in Pamunuwa, Maharagama.","Southern Expressway (E01)","VERIFIED",1},
            {"2 Acre Rubber Land in Ratnapura","Ratnapura","Pelmadulla","Kahawatta Road","Rubber",320,14400000,true, "Two acres of mature rubber in tapping.",null,"PENDING",8},
            {"22 Perch Residential Land in Negombo","Gampaha","Negombo","Kochchikade","Residential",22,13200000,false, "A 22 perch block in Kochchikade, Negombo.","Colombo–Katunayake Expressway (E03)","VERIFIED",2},
            {"16 Perch Land in Jaffna Nallur","Jaffna","Nallur","Kandy Road","Residential",16,6400000,true, "Sixteen perch residential land in Nallur.",null,"PENDING",1},
            {"Industrial Land 1 Acre in Horana","Kalutara","Horana","Poruwadanda","Industrial",160,32000000,false, "One acre of industrial-zoned land at Poruwadanda, Horana.","Southern Expressway (E01)","VERIFIED",5},
            {"35 Perch Investment Land in Trincomalee","Trincomalee","Nilaveli","Nilaveli Beach Road","Investment",35,10500000,true, "Thirty-five perch block 400 m from Nilaveli beach.",null,"PENDING",3},
            {"18 Perch Land near Ella Town","Badulla","Ella","Kithalella","Residential",18,9900000,false, "Eighteen perches with a stunning view towards Ella Rock.",null,"VERIFIED",7}
        };

        String[] sellers = {"sunil@landhub.lk","kumari@landhub.lk","rizwan@landhub.lk","thavaraj@landhub.lk"};
        Random rand = new Random(42);

        for (int i = 0; i < lands.length; i++) {
            Object[] L = lands[i];
            String district = (String) L[1];
            String province = SriLankaData.findProvince(district);
            double[] coords = SriLankaData.DISTRICT_COORDS.getOrDefault(district, new double[]{7.87, 80.77});
            double perches = ((Number) L[5]).doubleValue();
            long price = ((Number) L[6]).longValue();
            LocalDateTime created = LocalDateTime.now().minusDays((long)(i % 8) * 26);

            Land land = landRepo.save(Land.builder()
                    .sellerId(ids.get(sellers[i % sellers.length]))
                    .title((String) L[0]).description((String) L[8])
                    .landType(LandType.valueOf((String) L[4]))
                    .province(province).district(district).city((String) L[2])
                    .area((String) L[3]).address(L[3] + ", " + L[2] + ", " + district)
                    .perches(BigDecimal.valueOf(perches))
                    .price(BigDecimal.valueOf(price))
                    .pricePerPerch(BigDecimal.valueOf(Math.round(price / perches)))
                    .negotiable((Boolean) L[7])
                    .lat(BigDecimal.valueOf(coords[0] + (rand.nextDouble() - 0.5) * 0.06).setScale(6, RoundingMode.HALF_UP))
                    .lng(BigDecimal.valueOf(coords[1] + (rand.nextDouble() - 0.5) * 0.06).setScale(6, RoundingMode.HALF_UP))
                    .electricity(true).water(true).mainRoad(true).clearDeed(true).surveyPlan(true)
                    .nearestHighway((String) L[9])
                    .nearby("[]")
                    .status(LandStatus.ACTIVE).verification(Verification.valueOf((String) L[10]))
                    .views(40 + rand.nextInt(900))
                    .createdAt(created)
                    .build());

            int img = ((Number) L[11]).intValue();
            for (int j = 0; j < 3; j++) {
                int g = j == 0 ? img : ((img + j) % 8) + 1;
                imageRepo.save(LandImage.builder().landId(land.getId()).url("/img/land" + g + ".jpg").isCover(j == 0).sortOrder(j).build());
            }

            boolean verified = "VERIFIED".equals(L[10]);
            docRepo.save(LandDocument.builder().landId(land.getId()).uploadedBy(land.getSellerId()).docType(DocType.DEED).fileName("deed_land_" + land.getId() + ".pdf").status(verified ? Verification.VERIFIED : Verification.PENDING).build());
            docRepo.save(LandDocument.builder().landId(land.getId()).uploadedBy(land.getSellerId()).docType(DocType.SURVEY_PLAN).fileName("plan_land_" + land.getId() + ".pdf").status(verified ? Verification.VERIFIED : Verification.PENDING).build());
        }

        // Bookings, Payments, Reviews, Messages
        Long buyer = ids.get("dilani@landhub.lk");
        Long buyer2 = ids.get("chathura@landhub.lk");
        Land l1 = landRepo.findAll().stream().filter(l -> l.getStatus() == LandStatus.ACTIVE).findFirst().orElse(null);
        Land l2 = landRepo.findAll().stream().filter(l -> l.getStatus() == LandStatus.ACTIVE).skip(3).findFirst().orElse(null);

        if (l1 != null) {
            Booking b1 = bookingRepo.save(Booking.builder()
                    .landId(l1.getId()).buyerId(buyer).sellerId(l1.getSellerId())
                    .buyerName("Dilani Fernando").contactNo("+94 70 334 1122").email("dilani@landhub.lk")
                    .preferredDate(java.time.LocalDate.of(2026, 7, 12))
                    .message("I would like to visit the property this weekend.")
                    .status(BookingStatus.COMPLETED).build());

            paymentRepo.save(Payment.builder()
                    .bookingId(b1.getId()).payerId(buyer).amount(BigDecimal.valueOf(500000))
                    .method(PaymentMethod.ONLINE).status(PaymentStatus.SUCCESSFUL)
                    .reference("LHDEMO001").invoiceNo("INV-2026-00001").build());

            reviewRepo.save(Review.builder()
                    .landId(l1.getId()).sellerId(l1.getSellerId()).buyerId(buyer)
                    .rating(5).comment("Very transparent seller. All documents were ready and the lawyer had no issues with the deed. Highly recommended.")
                    .status(ReviewStatus.APPROVED).build());

            long a = Math.min(buyer, l1.getSellerId()), b = Math.max(buyer, l1.getSellerId());
            String conv = l1.getId() + ":" + a + ":" + b;
            messageRepo.save(Message.builder().conversation(conv).landId(l1.getId()).senderId(buyer).receiverId(l1.getSellerId()).body("Hello, is this land still available? I am interested in visiting on Saturday.").build());
            messageRepo.save(Message.builder().conversation(conv).landId(l1.getId()).senderId(l1.getSellerId()).receiverId(buyer).body("Yes, it is available. Saturday 10 AM works well. I will bring the survey plan and deed copies.").build());

            sellerRepo.findByUserId(l1.getSellerId()).ifPresent(s -> {
                s.setRatingAvg(BigDecimal.valueOf(5.0));
                s.setRatingCount(1);
                sellerRepo.save(s);
            });
        }

        if (l2 != null) {
            bookingRepo.save(Booking.builder()
                    .landId(l2.getId()).buyerId(buyer2).sellerId(l2.getSellerId())
                    .buyerName("Chathura Bandara").contactNo("+94 72 556 7788").email("chathura@landhub.lk")
                    .preferredDate(java.time.LocalDate.of(2026, 8, 24))
                    .message("Is the price negotiable for a cash purchase?")
                    .status(BookingStatus.PENDING).build());

            reviewRepo.save(Review.builder()
                    .sellerId(l2.getSellerId()).buyerId(buyer2)
                    .rating(4).comment("Good communication, but the site visit was rescheduled once.")
                    .status(ReviewStatus.PENDING).build());

            wishlistRepo.save(Wishlist.builder().userId(buyer).landId(l2.getId()).build());
        }

        notifRepo.save(Notification.builder().userId(buyer).type("WELCOME").title("Welcome to LandHub Sri Lanka").body("Start by saving properties you like.").link("/buyer").build());

        log.info("  ✓ Demo data ready (login: admin@landhub.lk / Landhub@2026)");
    }
}
