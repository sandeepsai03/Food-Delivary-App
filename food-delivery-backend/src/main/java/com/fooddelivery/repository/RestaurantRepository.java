package com.fooddelivery.repository;

import com.fooddelivery.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    // ★★★ THIS IS THE FIX for the 'N/A' owner name ★★★
    // These queries tell Hibernate to fetch the 'owner' (User) at the same time
    // as the Restaurant, solving the lazy loading issue. Using LEFT JOIN is safer
    // in case a restaurant somehow has no owner.
    @Query("SELECT r FROM Restaurant r LEFT JOIN FETCH r.owner WHERE r.active = false")
    List<Restaurant> findPendingRestaurantsWithOwners();

    @Query("SELECT r FROM Restaurant r LEFT JOIN FETCH r.owner WHERE r.active = true")
    List<Restaurant> findActiveRestaurantsWithOwners();
    
    // We can keep the simple versions too, in case they are needed elsewhere
    List<Restaurant> findByActiveFalse();
    List<Restaurant> findByActiveTrue();
}