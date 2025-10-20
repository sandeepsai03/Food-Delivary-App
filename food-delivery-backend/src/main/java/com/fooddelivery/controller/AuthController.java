package com.fooddelivery.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fooddelivery.entity.Address;
import com.fooddelivery.entity.DeliveryPartnerProfile; // ★★★ ADD IMPORT ★★★
import com.fooddelivery.entity.Restaurant;
import com.fooddelivery.entity.User;
import com.fooddelivery.enums.RoleType;
import com.fooddelivery.security.JwtService;
import com.fooddelivery.service.CustomerProfileService;
import com.fooddelivery.service.DeliveryPartnerService; // ★★★ ADD IMPORT ★★★
import com.fooddelivery.service.RestaurantService;
import com.fooddelivery.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final CustomerProfileService customerProfileService;
    private final RestaurantService restaurantService;
    private final DeliveryPartnerService deliveryPartnerService; // ★★★ ADD DEPENDENCY ★★★
    private final JwtService jwtService;
    private final AuthenticationManager authManager;
    private final ObjectMapper objectMapper;

    // ★★★ UPDATE CONSTRUCTOR ★★★
    public AuthController(UserService userService, CustomerProfileService customerProfileService, RestaurantService restaurantService, DeliveryPartnerService deliveryPartnerService, JwtService jwtService, AuthenticationManager authManager, ObjectMapper objectMapper) {
        this.userService = userService;
        this.customerProfileService = customerProfileService;
        this.restaurantService = restaurantService;
        this.deliveryPartnerService = deliveryPartnerService;
        this.jwtService = jwtService;
        this.authManager = authManager;
        this.objectMapper = objectMapper;
    }

    /**
     * Public: A customer registers themselves.
     */
    @PostMapping("/register/customer")
    public ResponseEntity<Map<String, Object>> registerCustomer(@RequestBody Map<String, Object> payload) {
        User user = new User();
        user.setName((String) payload.get("name"));
        user.setEmail((String) payload.get("email"));
        user.setPassword((String) payload.get("password"));
        user.setPhone((String) payload.get("phone"));
        user.setAvatarUrl((String) payload.get("avatarUrl"));
        user.setRole(RoleType.CUSTOMER);

        User savedUser = userService.createUser(user);

        if (payload.containsKey("address")) {
            Address address = objectMapper.convertValue(payload.get("address"), Address.class);
            customerProfileService.createCustomerProfile(savedUser.getId(), address);
        }

        String jwtToken = jwtService.generateToken(savedUser.getEmail());
        Map<String, Object> response = new HashMap<>();
        response.put("token", jwtToken);
        response.put("user", savedUser); // NOTE: In prod, use a DTO to hide the password hash

        return ResponseEntity.ok(response);
    }

    /**
     * Public: A delivery partner registers with user and profile details.
     */
    @PostMapping("/register/delivery-partner")
    public ResponseEntity<DeliveryPartnerProfile> registerDeliveryPartner(@RequestBody Map<String, Object> payload) {
        // ★★★ THIS METHOD IS NOW CORRECT ★★★
        // It delegates the entire nested payload to the dedicated service.
        DeliveryPartnerProfile pendingProfile = deliveryPartnerService.registerDeliveryPartner(payload);
        return new ResponseEntity<>(pendingProfile, HttpStatus.CREATED);
    }

    /**
     * Public: A restaurant owner registers with owner and restaurant details.
     */
    @PostMapping("/register/restaurant")
    public ResponseEntity<Restaurant> registerRestaurant(@RequestBody Map<String, Object> payload) {
        Restaurant pendingRestaurant = restaurantService.registerRestaurant(payload);
        return new ResponseEntity<>(pendingRestaurant, HttpStatus.CREATED);
    }

    /**
     * Login for any user role.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        Authentication authToken = new UsernamePasswordAuthenticationToken(email, password);
        authManager.authenticate(authToken);

        String jwtToken = jwtService.generateToken(email);
        User dbUser = userService.getUserByEmail(email);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("token", jwtToken);
        responseBody.put("role", dbUser.getRole());
        responseBody.put("email", dbUser.getEmail());
        responseBody.put("name", dbUser.getName());

        return ResponseEntity.ok(responseBody);
    }
}