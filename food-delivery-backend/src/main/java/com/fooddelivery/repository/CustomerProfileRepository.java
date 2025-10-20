package com.fooddelivery.repository;

import com.fooddelivery.entity.CustomerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerProfileRepository extends JpaRepository<CustomerProfile, Long> {

    /**
     * Finds a customer profile by the ID of its associated user.
     * This is useful for retrieving a profile when you only have the logged-in user's ID.
     */
    Optional<CustomerProfile> findByUserId(Long userId);
}