package com.fooddelivery.controller;


import com.fooddelivery.entity.User;
import com.fooddelivery.service.StripeService;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class StripePaymentController {

    private final StripeService stripeService;

    public StripePaymentController(StripeService stripeService) {
        this.stripeService = stripeService;
    }

    @PostMapping("/create-payment-intent")
    public ResponseEntity<Map<String, String>> createPaymentIntent(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal User user) { // Get the authenticated user
        try {
            if (user == null) {
                return ResponseEntity.status(401).build(); // Unauthorized
            }
            
            BigDecimal amount = new BigDecimal(payload.get("amount").toString());

            // Pass the user's ID to the service
            PaymentIntent paymentIntent = stripeService.createPaymentIntent(amount, user.getId());
            
            Map<String, String> response = Map.of("clientSecret", paymentIntent.getClientSecret());
            
            return ResponseEntity.ok(response);
        } catch (StripeException | ClassCastException | NullPointerException e) {
            return ResponseEntity.status(500).build();
        }
    }
}