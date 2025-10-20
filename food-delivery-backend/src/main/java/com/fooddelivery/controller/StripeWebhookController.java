package com.fooddelivery.controller;

import com.fooddelivery.config.StripeConfig;
import com.fooddelivery.service.OrderService;
import com.google.gson.JsonSyntaxException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.*;
import com.stripe.net.Webhook;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/stripe-webhook")
public class StripeWebhookController {

    private final OrderService orderService;
    private final StripeConfig stripeConfig;

    public StripeWebhookController(OrderService orderService, StripeConfig stripeConfig) {
        this.orderService = orderService;
        this.stripeConfig = stripeConfig;
    }

    @PostMapping
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, stripeConfig.getWebhookSecret());
        } catch (JsonSyntaxException | SignatureVerificationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook error: " + e.getMessage());
        }

        EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
        if (dataObjectDeserializer.getObject().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook error: Deserialization failed.");
        }
        StripeObject stripeObject = dataObjectDeserializer.getObject().get();

        // Handle the event
        if ("payment_intent.succeeded".equals(event.getType())) {
            PaymentIntent paymentIntent = (PaymentIntent) stripeObject;
            System.out.println("Payment for " + paymentIntent.getAmount() + " succeeded.");
            
            // ★★★ FULFILL THE ORDER ★★★
            try {
                // Retrieve the userId from the metadata we attached earlier
                String userIdStr = paymentIntent.getMetadata().get("userId");
                if (userIdStr == null) {
                    System.err.println("CRITICAL: Webhook received for payment_intent.succeeded but no userId in metadata!");
                    // Return a 200 OK to Stripe so it doesn't retry, but log this critical error.
                    return ResponseEntity.ok("Webhook received but missing metadata.");
                }

                Long userId = Long.parseLong(userIdStr);
                
                // Call your OrderService to create the order and clear the cart
                orderService.createOrderFromCart(userId);
                
                System.out.println("Order successfully created for user: " + userId);

            } catch (NumberFormatException e) {
                System.err.println("CRITICAL: Could not parse userId from metadata: " + e.getMessage());
                return ResponseEntity.ok("Webhook received but metadata was malformed.");
            } catch (Exception e) {
                // Catch any other exceptions during order creation
                System.err.println("Error during order fulfillment: " + e.getMessage());
                // Return a server error status. Stripe will retry the webhook.
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Order fulfillment failed.");
            }
        } else {
            System.out.println("Unhandled event type: " + event.getType());
        }

        // Return a 200 OK response to Stripe to acknowledge receipt of the event
        return ResponseEntity.ok("Webhook received");
    }
}