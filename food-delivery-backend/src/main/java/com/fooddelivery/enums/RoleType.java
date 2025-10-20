package com.fooddelivery.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum RoleType {
	CUSTOMER,
    RESTAURANT,
    ADMIN,
    DELIVERYMAN;
 
    @JsonCreator
    public static RoleType fromString(String value) {
        return RoleType.valueOf(value.toUpperCase());
    }
}