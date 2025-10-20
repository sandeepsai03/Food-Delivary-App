package com.fooddelivery.service;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class StripeService {

	public PaymentIntent createPaymentIntent(BigDecimal amount, Long userId) throws StripeException {
        PaymentIntentCreateParams params =
            PaymentIntentCreateParams.builder()
                .setAmount(amount.multiply(new BigDecimal("100")).longValue())
                .setCurrency("inr")
                .addPaymentMethodType("card")
                // Add the user's ID as metadata to link the payment back to the user
                .putMetadata("userId", userId.toString()) 
                .build();

        return PaymentIntent.create(params);
    }
}