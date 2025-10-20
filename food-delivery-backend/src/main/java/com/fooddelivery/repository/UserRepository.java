package com.fooddelivery.repository;

import com.fooddelivery.entity.User;
import com.fooddelivery.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    // ★★★ THIS IS THE CRITICAL QUERY FOR FIXING THE 500 ERROR ★★★
    // It fetches the User and all related profiles in a single database trip.
    @Query("SELECT u FROM User u " +
           "LEFT JOIN FETCH u.restaurant " +
           "LEFT JOIN FETCH u.customerProfile " +
           "LEFT JOIN FETCH u.deliveryPartnerProfile " +
           "WHERE u.role = :role")
    List<User> findByRoleWithDetails(@Param("role") RoleType role);
    
    @Query("SELECT u FROM User u " +
            "LEFT JOIN FETCH u.deliveryPartnerProfile " +
            "LEFT JOIN FETCH u.customerProfile " +
            "LEFT JOIN FETCH u.restaurant " +
            "WHERE u.email = :email")
     Optional<User> findByEmailWithDetails(@Param("email") String email);
 

    List<User> findByRole(RoleType role);

    @Query("SELECT u FROM User u " +
            "LEFT JOIN FETCH u.deliveryPartnerProfile " +
            "LEFT JOIN FETCH u.customerProfile " +
            "LEFT JOIN FETCH u.restaurant " +
            "WHERE u.id = :userId")
     Optional<User> findByIdWithDeliveryProfile(@Param("userId") Long userId);
}