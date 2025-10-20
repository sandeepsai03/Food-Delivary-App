package com.fooddelivery.controller;

import com.fooddelivery.entity.*;
import com.fooddelivery.repository.UserRepository;
import com.fooddelivery.service.CartService;
import com.fooddelivery.service.MenuItemService;
import com.fooddelivery.service.OrderService;
import com.fooddelivery.service.RestaurantService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer")
@CrossOrigin(origins = "*")
public class CustomerController {

    private final RestaurantService restaurantService;
    private final MenuItemService menuItemService;
    private final CartService cartService;
    private final OrderService orderService;
    private final UserRepository userRepository; // Kept for fetching the current user

    public CustomerController(RestaurantService restaurantService, MenuItemService menuItemService, CartService cartService, OrderService orderService, UserRepository userRepository) {
        this.restaurantService = restaurantService;
        this.menuItemService = menuItemService;
        this.cartService = cartService;
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Current user not found in database"));
    }

    @GetMapping("/restaurants")
    @PreAuthorize("hasRole('CUSTOMER')")
    public List<Restaurant> getRestaurants() {
        return restaurantService.getAllActiveRestaurants();
    }

    @GetMapping("/restaurant/{id}/menu")
    @PreAuthorize("hasRole('CUSTOMER')")
    public List<MenuItem> getMenu(@PathVariable Long id) {
        return menuItemService.getAvailableMenuItemsByRestaurant(id);
    }

    @GetMapping("/cart")
    public ResponseEntity<Cart> getCart(Authentication authentication) {
        User user = getCurrentUser(authentication);
        Cart cart = cartService.getCartByUserId(user.getId());
        return ResponseEntity.ok(cart);
    }

   
    @PostMapping("/cart/items")
    public ResponseEntity<Cart> addItemToCart(@RequestParam Long menuItemId,
                                              @RequestParam(defaultValue = "1") int quantity,
                                              Authentication authentication) {
        User user = getCurrentUser(authentication);
        Cart updatedCart = cartService.addItemToCart(user.getId(), menuItemId, quantity);
        return ResponseEntity.ok(updatedCart);
    }

    
    @DeleteMapping("/cart/items/{cartItemId}")
    public ResponseEntity<Cart> removeItemFromCart(@PathVariable Long cartItemId, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Cart updatedCart = cartService.removeItemFromCart(user.getId(), cartItemId);
        return ResponseEntity.ok(updatedCart);
    }

    // --- Order Endpoints ---

    
    @PostMapping("/orders")
    public ResponseEntity<Order> placeOrder(Authentication authentication) {
        User user = getCurrentUser(authentication);
        Order newOrder = orderService.createOrderFromCart(user.getId());
        return ResponseEntity.ok(newOrder);
    }

   
    @GetMapping("/orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<Order>> getMyOrders(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        List<Order> orders = orderService.getOrdersByUserId(currentUser.getId());
        return ResponseEntity.ok(orders);
    }
    
    @GetMapping("/my/orders/{orderId}")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<Order> getMyRestaurantOrderById(@PathVariable Long orderId) {
        // We will create the getOrderByIdWithDetails method in the service next.
        Order order = orderService.getOrderByIdWithDetails(orderId);
        return ResponseEntity.ok(order);
    }
    
    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<Order>> getMyOrderHistory(Authentication authentication) {
        // Find the User object for the currently logged-in user
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));

        // Call the service to get all orders for this specific user ID
        List<Order> orders = orderService.getOrdersByUserId(currentUser.getId());
        
        return ResponseEntity.ok(orders);
    }
}