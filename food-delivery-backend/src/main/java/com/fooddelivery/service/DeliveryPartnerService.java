package com.fooddelivery.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fooddelivery.entity.Delivery;
import com.fooddelivery.entity.DeliveryPartnerProfile;
import com.fooddelivery.entity.Order;
import com.fooddelivery.entity.User;
import com.fooddelivery.enums.DeliveryStatus;
import com.fooddelivery.enums.OrderStatus;
import com.fooddelivery.enums.RoleType;
import com.fooddelivery.repository.DeliveryPartnerProfileRepository;
import com.fooddelivery.repository.DeliveryRepository;
import com.fooddelivery.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class DeliveryPartnerService {

    @Autowired private DeliveryRepository deliveryRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private DeliveryPartnerProfileRepository profileRepository; // For saving the new profile
    @Autowired private UserService userService; // For creating the user securely
    @Autowired private ObjectMapper objectMapper; // For converting the request data

    /**
     * ★★★ THIS IS THE FINAL IMPLEMENTATION ★★★
     * Handles the public registration of a new Delivery Partner.
     */
    @Transactional
    public DeliveryPartnerProfile registerDeliveryPartner(Map<String, Object> payload) {
        // Use ObjectMapper to convert the nested JSON map into Java objects
        User user = objectMapper.convertValue(payload.get("user"), User.class);
        DeliveryPartnerProfile profile = objectMapper.convertValue(payload.get("profile"), DeliveryPartnerProfile.class);

        // --- Set essential security and business logic properties ---
        user.setRole(RoleType.DELIVERYMAN);
        user.setAvailable(false); // Partners must be approved by an admin before they can go online

        // Use the existing UserService to create the user.
        // This is CRITICAL because UserService correctly encodes the password.
        User savedUser = userService.createUser(user);

        // Link the new profile to the newly created user and save it
        profile.setUser(savedUser);
        return profileRepository.save(profile);
    }

    // --- Methods for the DeliveryDashboard.jsx (These are already correct) ---

    @Transactional(readOnly = true)
    public User getPartnerProfile(Long userId) {
        return userRepository.findByIdWithDeliveryProfile(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
    }

    @Transactional
    public User updateAvailability(Long userId, boolean isAvailable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        user.setAvailable(isAvailable);
        
        // ★★★ THIS IS THE FIX ★★★
        // The save method returns the updated entity, so we return it from the service.
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<Delivery> getAvailableDeliveries(User deliveryPartner) {
        if (deliveryPartner.getAvailable() == null || !deliveryPartner.getAvailable()) {
            return Collections.emptyList();
        }
        return deliveryRepository.findAvailableDeliveriesWithDetails(DeliveryStatus.ASSIGNED);
    }

    @Transactional(readOnly = true)
    public List<Delivery> getActiveDeliveries(Long partnerId) {
        return deliveryRepository.findActiveByPartnerIdWithDetails(partnerId);
    }

    @Transactional
    public Delivery acceptDelivery(Long partnerId, Long deliveryId) {
        User deliveryPartner = userRepository.findById(partnerId).orElseThrow(() -> new RuntimeException("Partner not found."));
        Delivery delivery = deliveryRepository.findById(deliveryId).orElseThrow(() -> new RuntimeException("Delivery not found."));

        if (delivery.getDeliveryPartner() != null || delivery.getStatus() != DeliveryStatus.ASSIGNED) {
            throw new IllegalStateException("Delivery is no longer available.");
        }
        
        delivery.setDeliveryPartner(deliveryPartner);
        delivery.setStatus(DeliveryStatus.ACCEPTED);
        return deliveryRepository.save(delivery);
    }

    private Delivery updateDeliveryStatus(Long partnerId, Long deliveryId, DeliveryStatus newStatus) {
        // Find the delivery securely
        Delivery delivery = deliveryRepository.findByIdAndDeliveryPartnerId(deliveryId, partnerId)
                .orElseThrow(() -> new SecurityException("Delivery not found or not assigned to you."));
        
        // Use the robust enum logic to validate the transition
        if (!delivery.getStatus().canTransitionTo(newStatus)) {
            throw new IllegalArgumentException("Invalid status transition from " + delivery.getStatus() + " to " + newStatus);
        }
        
        // Update the delivery status
        delivery.setStatus(newStatus);
        
        // Also update the main Order status and, critically, the timestamps
        Order order = delivery.getOrder();
        if (newStatus == DeliveryStatus.PICKED_UP) {
            order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
            delivery.setPickedUpAt(OffsetDateTime.now()); // Set the pickup time
        } else if (newStatus == DeliveryStatus.DELIVERED) {
            order.setStatus(OrderStatus.DELIVERED);
            
            // ★★★ THIS IS THE CRITICAL FIX ★★★
            // Set the completion timestamp when the status is updated to DELIVERED.
            delivery.setDeliveredAt(OffsetDateTime.now()); 
        }
        
        return deliveryRepository.save(delivery);
    }

    @Transactional
    public Delivery markAsPickedUp(Long partnerId, Long deliveryId) {
        return updateDeliveryStatus(partnerId, deliveryId, DeliveryStatus.PICKED_UP);
    }

    @Transactional
    public Delivery markAsDelivered(Long partnerId, Long deliveryId) {
        return updateDeliveryStatus(partnerId, deliveryId, DeliveryStatus.DELIVERED);
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getEarningsAndStats(Long partnerId) {
        // Define the time frame (from the start of the current day)
        OffsetDateTime startOfToday = OffsetDateTime.now().with(LocalTime.MIN);

        // Fetch all deliveries completed by this partner today
        List<Delivery> todaysCompletedDeliveries = deliveryRepository.findCompletedByPartnerSince(
            partnerId,
            DeliveryStatus.DELIVERED,
            startOfToday
        );

        // Calculate the stats from the list of deliveries
        long deliveryCount = todaysCompletedDeliveries.size();
        
        BigDecimal totalEarnings = todaysCompletedDeliveries.stream()
            .map(Delivery::getPayoutAmount)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        double totalDistance = todaysCompletedDeliveries.stream()
            .mapToDouble(d -> d.getDistanceKm() != null ? d.getDistanceKm() : 0)
            .sum();

        // Build the Map object that will be converted to JSON
        Map<String, Object> response = new HashMap<>();
        response.put("todaysDeliveries", deliveryCount);
        response.put("todaysEarnings", totalEarnings);
        response.put("totalDistanceKm", totalDistance);
        response.put("averageRating", 4.9); // This is a placeholder for now
        response.put("completedDeliveries", todaysCompletedDeliveries);

        return response;
    }
}