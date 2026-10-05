package services;

import models.*;
import com.landhub.exception.ApiException;
import data.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepo;
    private final RecentlyViewedRepository recentlyViewedRepo;
    private final LandRepository landRepo;
    private final LandService landService;

    public List<Map<String, Object>> list(Long userId) {
        return wishlistRepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(w -> landRepo.findById(w.getLandId()).map(l -> landService.decorate(l)).orElse(null))
                .filter(Objects::nonNull).toList();
    }

    @Transactional
    public Map<String, String> add(Long userId, Long landId) {
        landRepo.findById(landId).orElseThrow(() -> ApiException.notFound("Land not found"));
        if (!wishlistRepo.existsByUserIdAndLandId(userId, landId)) {
            wishlistRepo.save(Wishlist.builder().userId(userId).landId(landId).build());
        }
        return Map.of("message", "Added to wishlist");
    }

    @Transactional
    public Map<String, String> remove(Long userId, Long landId) {
        wishlistRepo.deleteByUserIdAndLandId(userId, landId);
        return Map.of("message", "Removed from wishlist");
    }

    public Map<String, Object> compare(Long userId, List<Long> ids) {
        List<Map<String, Object>> items = ids.stream()
                .distinct().limit(4)
                .map(id -> landRepo.findById(id).map(l -> landService.decorate(l)).orElse(null))
                .filter(Objects::nonNull).toList();
        return Map.of("items", items);
    }

    public Map<String, Object> recentlyViewed(Long userId) {
        List<Map<String, Object>> items = recentlyViewedRepo.findByUserIdOrderByViewedAtDesc(userId).stream()
                .limit(12)
                .map(rv -> landRepo.findById(rv.getLandId()).map(l -> landService.decorate(l)).orElse(null))
                .filter(Objects::nonNull).toList();
        return Map.of("items", items);
    }
}

