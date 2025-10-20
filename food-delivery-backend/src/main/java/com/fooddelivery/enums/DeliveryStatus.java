package com.fooddelivery.enums;

public enum DeliveryStatus {

    /**
     * The delivery has been created by the restaurant and is available
     * for any online delivery partner to accept.
     */
    ASSIGNED {
        @Override
        public boolean canTransitionTo(DeliveryStatus newStatus) {
            // An available delivery can only be ACCEPTED by a driver.
            return newStatus == ACCEPTED;
        }
    },

    /**
     * A specific delivery partner has accepted the delivery and is
     * heading to the restaurant.
     */
    ACCEPTED {
        @Override
        public boolean canTransitionTo(DeliveryStatus newStatus) {
            // An accepted delivery can only be marked as PICKED_UP.
            return newStatus == PICKED_UP;
        }
    },

    /**
     * The delivery partner has picked up the food from the restaurant
     * and is on their way to the customer.
     */
    PICKED_UP {
        @Override
        public boolean canTransitionTo(DeliveryStatus newStatus) {
            // A picked-up delivery can only be marked as DELIVERED.
            return newStatus == DELIVERED;
        }
    },

    /**
     * The delivery has been successfully completed. This is a final state.
     */
    DELIVERED;

    /**
     * Checks if a transition from the current status to a new status is valid.
     * By default, a state cannot transition to any other state. This makes the
     * system safer, as you must explicitly define all valid transitions.
     *
     * @param newStatus The target status.
     * @return true if the transition is valid, false otherwise.
     */
    public boolean canTransitionTo(DeliveryStatus newStatus) {
        // Final states like DELIVERED cannot transition to anything.
        return false;
    }
}