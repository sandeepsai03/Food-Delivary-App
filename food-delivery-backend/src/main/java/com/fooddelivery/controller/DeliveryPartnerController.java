package com.fooddelivery.controller;

import com.fooddelivery.entity.Delivery;
import com.fooddelivery.entity.User;
import com.fooddelivery.repository.UserRepository;
import com.fooddelivery.service.DeliveryPartnerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/delivery-partner") // This correctly matches your React component
@PreAuthorize("hasRole('DELIVERYMAN')")
public class DeliveryPartnerController {

    private final DeliveryPartnerService deliveryPartnerService;
    private final UserRepository userRepository;

    public DeliveryPartnerController(DeliveryPartnerService deliveryPartnerService, UserRepository userRepository) {
        this.deliveryPartnerService = deliveryPartnerService;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmailWithDetails(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Current authenticated user not found in database"));
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(Authentication authentication) {
        User profileUser = getCurrentUser(authentication);
        profileUser.setPassword(null); 
        return ResponseEntity.ok(profileUser);
    }

    @PutMapping("/availability")
    public ResponseEntity<User> updateAvailability(Authentication authentication, @RequestBody Map<String, Boolean> payload) {
        User user = getCurrentUser(authentication);
        Boolean isAvailable = payload.get("isAvailable");
        if (isAvailable == null) {
            return ResponseEntity.badRequest().build();
        }
        
        // ★★★ THIS IS THE FIX ★★★
        // 1. Call the service and get the updated user back.
        User updatedUser = deliveryPartnerService.updateAvailability(user.getId(), isAvailable);
        
        // 2. Never send the password hash to the frontend.
        updatedUser.setPassword(null); 
        
        // 3. Return the updated user in the response body.
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/deliveries/available")
    public ResponseEntity<List<Delivery>> getAvailableDeliveries(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(deliveryPartnerService.getAvailableDeliveries(currentUser));
    }

    @GetMapping("/deliveries/active")
    public ResponseEntity<List<Delivery>> getActiveDeliveries(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(deliveryPartnerService.getActiveDeliveries(user.getId()));
    }

    @PutMapping("/deliveries/{deliveryId}/accept")
    public ResponseEntity<Delivery> acceptDelivery(@PathVariable Long deliveryId, Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(deliveryPartnerService.acceptDelivery(user.getId(), deliveryId));
    }

    @PutMapping("/deliveries/{deliveryId}/pickup")
    public ResponseEntity<Delivery> markAsPickedUp(@PathVariable Long deliveryId, Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(deliveryPartnerService.markAsPickedUp(user.getId(), deliveryId));
    }

    @PutMapping("/deliveries/{deliveryId}/deliver")
    public ResponseEntity<Delivery> markAsDelivered(@PathVariable Long deliveryId, Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(deliveryPartnerService.markAsDelivered(user.getId(), deliveryId));
    }
    
    @GetMapping("/earnings")
    public ResponseEntity<Map<String, Object>> getEarnings(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(deliveryPartnerService.getEarningsAndStats(user.getId()));
    }
}