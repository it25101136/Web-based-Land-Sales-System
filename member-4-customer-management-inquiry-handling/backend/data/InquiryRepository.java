package data;

import models.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    List<Inquiry> findByCustomerIdOrderByUpdatedAtDesc(Long customerId);

    long countByStatus(String status);

    @Query("SELECT i FROM Inquiry i WHERE " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:category IS NULL OR i.category = :category) AND " +
           "(:q IS NULL OR LOWER(i.subject) LIKE LOWER(CONCAT('%', :q, '%'))) " +
           "ORDER BY CASE i.status WHEN 'OPEN' THEN 0 WHEN 'PENDING_CLARIFICATION' THEN 1 ELSE 2 END, i.updatedAt DESC")
    List<Inquiry> searchInquiries(
            @Param("status") String status,
            @Param("category") String category,
            @Param("q") String q);
}

