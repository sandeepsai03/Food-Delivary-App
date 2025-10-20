package com.fooddelivery.controller;

import com.fooddelivery.entity.Restaurant;
import com.fooddelivery.entity.User;
import com.fooddelivery.enums.RoleType;
import com.fooddelivery.service.AdminService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // --- User Management Endpoints ---

    @PostMapping("/create-admin")
    public ResponseEntity<User> createAdmin(@RequestBody User userPayload) {
        User newAdmin = adminService.createAdmin(userPayload);
        newAdmin.setPassword(null);
        return new ResponseEntity<>(newAdmin, HttpStatus.CREATED);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getUsersByRole(@RequestParam RoleType role) {
        List<User> users = adminService.getAllUsersByRole(role);
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        User updatedUser = adminService.updateUser(id, userDetails);
        updatedUser.setPassword(null);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // --- Restaurant Management Endpoints ---

    @GetMapping("/restaurants/pending")
    public ResponseEntity<List<Restaurant>> getPendingRestaurants() {
        return ResponseEntity.ok(adminService.getPendingRestaurants());
    }

    @PutMapping("/restaurants/{restaurantId}/approve")
    public ResponseEntity<Restaurant> approveRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(adminService.approveRestaurant(restaurantId));
    }
    
    // ★★★ THIS IS THE MISSING ENDPOINT ★★★
    @PutMapping("/restaurants/{id}")
    public ResponseEntity<Restaurant> updateRestaurant(@PathVariable Long id, @RequestBody Restaurant restaurantDetails) {
        Restaurant updatedRestaurant = adminService.updateRestaurant(id, restaurantDetails);
        return ResponseEntity.ok(updatedRestaurant);
    }

    // ★★★ A MISSING DELETE ENDPOINT WAS ALSO ADDED FOR COMPLETENESS ★★★
    @DeleteMapping("/restaurants/{id}")
    public ResponseEntity<Void> deleteRestaurant(@PathVariable Long id) {
        adminService.deleteRestaurant(id);
        return ResponseEntity.noContent().build();
    }


    // --- Delivery Partner Management Endpoints ---

    @PutMapping("/delivery-partners/{userId}/approve")
    public ResponseEntity<User> approveDeliveryPartner(@PathVariable Long userId) {
        User approvedPartner = adminService.approveDeliveryPartner(userId);
        approvedPartner.setPassword(null);
        return ResponseEntity.ok(approvedPartner);
    }
}