package com.fooddelivery.service;

import com.fooddelivery.entity.Address;
import com.fooddelivery.entity.DeliveryPartnerProfile;
import com.fooddelivery.entity.Restaurant;
import com.fooddelivery.entity.User;
import com.fooddelivery.enums.ProfileStatus;
import com.fooddelivery.enums.RoleType;
import com.fooddelivery.repository.DeliveryPartnerProfileRepository;
import com.fooddelivery.repository.RestaurantRepository;
import com.fooddelivery.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserService userService;
    private final DeliveryPartnerProfileRepository profileRepository;
    

    public AdminService(UserRepository userRepository, RestaurantRepository restaurantRepository, UserService userService, DeliveryPartnerProfileRepository profileRepository) {
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.userService = userService;
		this.profileRepository = profileRepository;
    }

    // --- User Management ---

    @Transactional
    public User createAdmin(User user) {
        user.setRole(RoleType.ADMIN);
        return userService.createUser(user);
    }

    @Transactional(readOnly = true)
    public List<User> getAllUsersByRole(RoleType role) {        
        return userRepository.findByRoleWithDetails(role);
    }

    @Transactional
    public User updateUser(Long userId, User userDetails) {
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        // Update basic User fields
        existingUser.setName(userDetails.getName());
        existingUser.setEmail(userDetails.getEmail());
        existingUser.setRole(userDetails.getRole());
        existingUser.setPhone(userDetails.getPhone());
        
        if (userDetails.getAvailable() != null) {
            existingUser.setAvailable(userDetails.getAvailable());
        }

        // If the user is a delivery partner, update their profile details
        if (existingUser.getRole() == RoleType.DELIVERYMAN && userDetails.getDeliveryPartnerProfile() != null) {
            DeliveryPartnerProfile existingProfile = existingUser.getDeliveryPartnerProfile();
            DeliveryPartnerProfile detailsProfile = userDetails.getDeliveryPartnerProfile();
            
            if (existingProfile != null) {
                // Update all the fields
                existingProfile.setZone(detailsProfile.getZone());
                existingProfile.setVehicleType(detailsProfile.getVehicleType());
                existingProfile.setVehicleModel(detailsProfile.getVehicleModel());
                existingProfile.setLicenseNumber(detailsProfile.getLicenseNumber());
                existingProfile.setVehicleRegistrationNumber(detailsProfile.getVehicleRegistrationNumber());

                if (existingUser.getAvailable()) {
                    existingProfile.setStatus(com.fooddelivery.enums.ProfileStatus.APPROVED);
                } else {
                    existingProfile.setStatus(com.fooddelivery.enums.ProfileStatus.PENDING);
                }
                
                profileRepository.save(existingProfile);
            }
        }        
        return userRepository.save(existingUser);
    }

    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new EntityNotFoundException("User not found with id: " + userId);
        }
        userRepository.deleteById(userId);
    }

    // --- Restaurant Management ---

    @Transactional(readOnly = true)
    public List<Restaurant> getPendingRestaurants() {
        // Call the new query method that fetches owners
        return restaurantRepository.findPendingRestaurantsWithOwners();
    }

    @Transactional
    public Restaurant approveRestaurant(Long restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found with id: " + restaurantId));
        restaurant.setActive(true);
        return restaurantRepository.save(restaurant);
    }

    @Transactional
    public Restaurant updateRestaurant(Long restaurantId, Restaurant restaurantDetails) {
        Restaurant existingRestaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found with id: " + restaurantId));

        existingRestaurant.setName(restaurantDetails.getName());
        existingRestaurant.setActive(restaurantDetails.getActive());
        existingRestaurant.setEstimatedDeliveryTime(restaurantDetails.getEstimatedDeliveryTime());

        if (restaurantDetails.getAddress() != null) {
            if (existingRestaurant.getAddress() == null) {
                existingRestaurant.setAddress(new Address());
            }
            // Update only the fields provided, e.g., city
            if(restaurantDetails.getAddress().getCity() != null) {
               existingRestaurant.getAddress().setCity(restaurantDetails.getAddress().getCity());
            }
            
        }
        return restaurantRepository.save(existingRestaurant);
    }
    
    
    /**
     * Deletes a restaurant by its ID.
     */
    @Transactional
    public void deleteRestaurant(Long restaurantId) {
        if (!restaurantRepository.existsById(restaurantId)) {
            throw new EntityNotFoundException("Restaurant not found with id: " + restaurantId);
        }
        restaurantRepository.deleteById(restaurantId);
    }

    // --- Delivery Partner Management ---

    @Transactional
    public User approveDeliveryPartner(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        if (user.getRole() != RoleType.DELIVERYMAN) {
            throw new IllegalStateException("User is not a delivery partner.");
        }
        user.setAvailable(true);
        if (user.getDeliveryPartnerProfile() != null) {
            user.getDeliveryPartnerProfile().setStatus(ProfileStatus.APPROVED);
        }

        return userRepository.save(user);
    }
}