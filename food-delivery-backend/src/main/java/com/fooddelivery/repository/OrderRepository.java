package com.fooddelivery.repository;

import com.fooddelivery.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // This query is for the "My Orders" list
	 @Query("SELECT o FROM Order o " +
	           "JOIN FETCH o.customer c " +
	           "JOIN FETCH c.user u " +
	           "JOIN FETCH o.restaurant r " +
	           "LEFT JOIN FETCH o.items i " +
	           "LEFT JOIN FETCH i.menuItem mi " +
	           "WHERE u.id = :userId ORDER BY o.createdAt DESC")
	    List<Order> findOrdersByUserIdWithDetails(@Param("userId") Long userId);
    // ★★★ ADD THIS NEW METHOD TO FIX THE "PLACE ORDER" CRASH ★★★
    // It finds a single order by ID and eagerly fetches all related data needed for the JSON response.
	 @Query("SELECT o FROM Order o " +
	           "JOIN FETCH o.customer c " +          // Go from Order to CustomerProfile
	           "JOIN FETCH c.user u " +              // THEN go from CustomerProfile to User
	           "JOIN FETCH o.restaurant r " +
	           "LEFT JOIN FETCH o.items i " +
	           "LEFT JOIN FETCH i.menuItem mi " +
	           "WHERE o.id = :orderId")
	    Optional<Order> findByIdWithDetails(@Param("orderId") Long orderId);

	 List<Order> findByRestaurantId(Long restaurantId);
    // ... your other existing methods ...
	Optional<Order> findByIdAndRestaurantId(Long orderId, Long restaurantId);
}