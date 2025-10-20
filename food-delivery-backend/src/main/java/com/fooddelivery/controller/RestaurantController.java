package com.fooddelivery.controller;

import com.fooddelivery.entity.MenuItem;
import com.fooddelivery.entity.Order;
import com.fooddelivery.entity.Restaurant;
import com.fooddelivery.entity.User;
import com.fooddelivery.enums.OrderStatus;
import com.fooddelivery.repository.UserRepository;
import com.fooddelivery.service.MenuItemService;
import com.fooddelivery.service.OrderService;
import com.fooddelivery.service.RestaurantService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;
    private final OrderService orderService;
    private final MenuItemService menuItemService;
    private final UserRepository userRepository;

    public RestaurantController(
        RestaurantService restaurantService, 
        OrderService orderService, 
        MenuItemService menuItemService, 
        UserRepository userRepository
    ) {
        this.restaurantService = restaurantService;
        this.orderService = orderService;
        this.menuItemService = menuItemService;
        this.userRepository = userRepository;
    }

    // --- Public Endpoints ---

    @GetMapping
    public ResponseEntity<List<Restaurant>> getActiveRestaurants() {
        return ResponseEntity.ok(restaurantService.getAllActiveRestaurants());
    }

    @GetMapping("/{restaurantId}/menu")
    public ResponseEntity<List<MenuItem>> getRestaurantMenu(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(menuItemService.getAvailableMenuItemsByRestaurant(restaurantId));
    }

    // --- Restaurant Owner: Details ---

    @GetMapping("/my/details")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<Restaurant> getMyRestaurantDetails(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Restaurant restaurant = currentUser.getRestaurant();
        return restaurant != null ? ResponseEntity.ok(restaurant) : ResponseEntity.notFound().build();
    }
    
    @PutMapping("/my/details")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<Restaurant> updateMyRestaurantDetails(Authentication authentication, @RequestBody Restaurant updatedDetails) {
        User currentUser = getCurrentUser(authentication);
        Restaurant restaurant = currentUser.getRestaurant();
        if (restaurant == null) {
            return ResponseEntity.notFound().build();
        }
        Restaurant savedRestaurant = restaurantService.updateRestaurant(restaurant.getId(), updatedDetails);
        return ResponseEntity.ok(savedRestaurant);
    }

    // --- Restaurant Owner: Orders ---

    @GetMapping("/my/orders")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<List<Order>> getMyRestaurantOrders(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        List<Order> orders = orderService.getOrdersByRestaurantId(currentUser.getRestaurant().getId());
        return ResponseEntity.ok(orders);
    }
    
    @PutMapping("/my/orders/{orderId}/status")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<Order> updateMyOrderStatus(
            @PathVariable Long orderId, 
            @RequestParam String status,
            Authentication authentication // Get the logged-in user's details
    ) {
        // 1. Get the currently authenticated user.
        User currentUser = getCurrentUser(authentication);
        Restaurant currentRestaurant = currentUser.getRestaurant();
        
        // 2. Check if the user actually owns a restaurant.
        if (currentRestaurant == null) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        // 3. Manually convert the string to the enum.
        OrderStatus newStatusEnum = OrderStatus.valueOf(status.toUpperCase());
        
        // 4. Call the service with both the orderId AND the user's restaurantId.
        Order updatedOrder = orderService.updateOrderStatus(orderId, currentRestaurant.getId(), newStatusEnum);
        
        return ResponseEntity.ok(updatedOrder);
    }
    

    // --- Restaurant Owner: Menu ---

    @GetMapping("/my/menu")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<List<MenuItem>> getMyRestaurantMenu(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        List<MenuItem> menuItems = menuItemService.getAllMenuItemsByRestaurant(currentUser.getRestaurant().getId());
        return ResponseEntity.ok(menuItems);
    }
    
    @PostMapping("/my/menu")
    @PreAuthorize("hasRole('RESTAURANT')")
    public MenuItem addMenuItemToMyRestaurant(Authentication authentication, @RequestBody MenuItem menuItem) {
        User user = getCurrentUser(authentication);
        return menuItemService.addMenuItemToRestaurant(user.getRestaurant().getId(), menuItem);
    }
    
    @PutMapping("/my/menu/{itemId}")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<MenuItem> updateMenuItemInMyRestaurant(@PathVariable Long itemId, @RequestBody MenuItem menuItemDetails) {
        MenuItem updatedMenuItem = menuItemService.updateMenuItem(itemId, menuItemDetails);
        return ResponseEntity.ok(updatedMenuItem);
    }

    @DeleteMapping("/my/menu/{itemId}")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<Void> deleteMenuItemFromMyRestaurant(@PathVariable Long itemId) {
        menuItemService.deleteMenuItem(itemId);
        return ResponseEntity.noContent().build();
    }
    
    // --- Private Helper ---

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Current user not found for email: " + authentication.getName()));
    }
}