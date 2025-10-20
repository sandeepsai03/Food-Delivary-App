package com.fooddelivery.repository;

import com.fooddelivery.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    Optional<Cart> findByCustomerId(Long customerId);

    // ★★★ ENSURE THIS METHOD EXISTS AND IS USED ★★★
    @Query("SELECT c FROM Cart c " +
           "LEFT JOIN FETCH c.items i " +
           "LEFT JOIN FETCH i.menuItem mi " +
           "WHERE c.customer.user.id = :userId")
    Optional<Cart> findCartByUserIdWithDetails(@Param("userId") Long userId);
}