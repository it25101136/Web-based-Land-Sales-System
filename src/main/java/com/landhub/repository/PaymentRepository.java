package com.landhub.repository;

import com.landhub.entity.Payment;
import com.landhub.entity.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT p FROM Payment p JOIN Booking b ON b.id = p.bookingId WHERE p.payerId = :userId OR b.sellerId = :userId ORDER BY p.createdAt DESC")
    List<Payment> findForUser(Long userId);

    List<Payment> findByPayerIdOrderByCreatedAtDesc(Long payerId);

    List<Payment> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(p.amount),0) FROM Payment p WHERE p.status = 'SUCCESSFUL'")
    BigDecimal totalSuccessfulRevenue();

    @Query("SELECT p.status, COUNT(p), COALESCE(SUM(p.amount),0) FROM Payment p GROUP BY p.status")
    List<Object[]> revenueByStatus();

    @Query("SELECT p.method, COUNT(p) FROM Payment p GROUP BY p.method")
    List<Object[]> countByMethod();

    long countByPayerId(Long payerId);
}
