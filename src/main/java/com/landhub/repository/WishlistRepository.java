package com.landhub.repository;

import com.landhub.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findByUserIdOrderByCreatedAtDesc(Long userId);
    void deleteByUserIdAndLandId(Long userId, Long landId);
    boolean existsByUserIdAndLandId(Long userId, Long landId);
}
