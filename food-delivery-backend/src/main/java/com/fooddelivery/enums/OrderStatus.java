package com.fooddelivery.enums;

import java.util.Set;

public enum OrderStatus {
    PENDING {
        @Override
        public boolean canTransitionTo(OrderStatus newStatus) {
            // A PENDING order can only transition to PREPARING or CANCELLED.
            return newStatus == PREPARING || newStatus == CANCELLED;
        }
    },
    PREPARING {
        @Override
        public boolean canTransitionTo(OrderStatus newStatus) {
            // A PREPARING order can only transition to READY_FOR_PICKUP or CANCELLED.
            return newStatus == READY_FOR_PICKUP || newStatus == CANCELLED;
        }
    },
    READY_FOR_PICKUP {
        @Override
        public boolean canTransitionTo(OrderStatus newStatus) {
            // Once ready, it can be picked up or, in some cases, cancelled.
            return newStatus == OUT_FOR_DELIVERY || newStatus == CANCELLED;
        }
    },
    OUT_FOR_DELIVERY {
        @Override
        public boolean canTransitionTo(OrderStatus newStatus) {
            // Once out for delivery, it can only be marked as DELIVERED.
            return newStatus == DELIVERED;
        }
    },
    DELIVERED, // Final state, cannot transition to anything
    CANCELLED; // Final state, cannot transition to anything

    /**
     * Abstract method that each enum constant must implement.
     * By default, a state cannot transition to any other state.
     * This makes the system safer, as you must explicitly define valid transitions.
     *
     * @param newStatus The target status.
     * @return true if the transition is valid, false otherwise.
     */
    public boolean canTransitionTo(OrderStatus newStatus) {
        return false;
    }
}