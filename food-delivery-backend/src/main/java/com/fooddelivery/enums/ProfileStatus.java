package com.fooddelivery.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum ProfileStatus {
    PENDING,
    APPROVED,
    REJECTED;
    
    @JsonCreator
    public static ProfileStatus fromString(String value) {
        if (value == null) {
            return null;
        }
        // This loop is safer than valueOf() as it won't throw an exception for invalid values
        for (ProfileStatus status : ProfileStatus.values()) {
            if (status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        
        return null; 
    }
}
