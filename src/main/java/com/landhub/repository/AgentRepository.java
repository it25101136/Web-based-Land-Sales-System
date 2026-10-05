package com.landhub.repository;

import com.landhub.entity.Agent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AgentRepository extends JpaRepository<Agent, Long> {
    Optional<Agent> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
