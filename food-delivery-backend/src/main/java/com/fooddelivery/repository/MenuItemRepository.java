package com.fooddelivery.repository;

import com.fooddelivery.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    /**
     * Finds all menu items for a specific restaurant.
     */
    List<MenuItem> findByRestaurantId(Long restaurantId);

    /**
     * Finds all available menu items for a specific restaurant.
     */
    List<MenuItem> findByRestaurantIdAndAvailableTrue(Long restaurantId);
}