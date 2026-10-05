package data;

import models.InquiryResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InquiryResponseRepository extends JpaRepository<InquiryResponse, Long> {

    List<InquiryResponse> findByInquiryIdOrderByCreatedAtAsc(Long inquiryId);
}

