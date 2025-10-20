package com.fooddelivery.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fooddelivery.entity.Restaurant;
import com.fooddelivery.entity.User;
import com.fooddelivery.enums.RoleType;
import com.fooddelivery.repository.RestaurantRepository;
import com.fooddelivery.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    public RestaurantService(RestaurantRepository restaurantRepository, UserRepository userRepository, UserService userService, ObjectMapper objectMapper) {
        this.restaurantRepository = restaurantRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.objectMapper = objectMapper;
    }
    
    
    @Transactional
    public Restaurant registerRestaurant(Map<String, Object> payload) {
        User owner = objectMapper.convertValue(payload.get("owner"), User.class);
        Restaurant restaurant = objectMapper.convertValue(payload.get("restaurant"), Restaurant.class);
        owner.setRole(RoleType.RESTAURANT);
        restaurant.setActive(false); 
        User savedOwner = userService.createUser(owner);
        restaurant.setOwner(savedOwner);
        return restaurantRepository.save(restaurant);
    }

    @Transactional
    public Restaurant createRestaurant(Restaurant restaurant, Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new EntityNotFoundException("Owner (User) not found with id: " + ownerId));
        restaurant.setOwner(owner);
        return restaurantRepository.save(restaurant);
    }

    @Transactional(readOnly = true)
    public Restaurant getRestaurantById(Long id) {
        return restaurantRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<Restaurant> getAllActiveRestaurants() {
        return restaurantRepository.findActiveRestaurantsWithOwners();
    }

    @Transactional
    public Restaurant updateRestaurantStatus(Long id, boolean isActive) {
        Restaurant restaurant = getRestaurantById(id);
        restaurant.setActive(isActive);
        return restaurantRepository.save(restaurant);
    }

    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
    // ★★★ THIS IS THE IMPLEMENTED METHOD FOR EDIT PROFILE ★★★
    @Transactional
	public Restaurant updateRestaurant(Long id, Restaurant updatedDetails) {
		Restaurant existingRestaurant = restaurantRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Restaurant not found with id: " + id));

        // Update only the fields that can be changed by the owner
        existingRestaurant.setName(updatedDetails.getName());
        existingRestaurant.setAddress(updatedDetails.getAddress());
        existingRestaurant.setPhone(updatedDetails.getPhone());
        existingRestaurant.setEmail(updatedDetails.getEmail());
        existingRestaurant.setImageUrl(updatedDetails.getImageUrl());
        existingRestaurant.setCategories(updatedDetails.getCategories());
        // Note: We do not update the 'owner' or 'active' status here.

		return restaurantRepository.save(existingRestaurant);
	}
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
}