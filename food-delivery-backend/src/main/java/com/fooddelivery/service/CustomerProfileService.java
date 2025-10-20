package com.fooddelivery.service;

import com.fooddelivery.entity.Address;
import com.fooddelivery.entity.CustomerProfile;
import com.fooddelivery.entity.User;
import com.fooddelivery.repository.CustomerProfileRepository;
import com.fooddelivery.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerProfileService {

    private final CustomerProfileRepository customerProfileRepository;
    private final UserRepository userRepository;

    public CustomerProfileService(CustomerProfileRepository customerProfileRepository, UserRepository userRepository) {
        this.customerProfileRepository = customerProfileRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CustomerProfile createCustomerProfile(Long userId, Address defaultAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        if (customerProfileRepository.findByUserId(userId).isPresent()) {
            throw new IllegalStateException("Customer profile already exists for this user.");
        }

        CustomerProfile profile = new CustomerProfile();
        profile.setUser(user);
        profile.setDefaultAddress(defaultAddress);
        return customerProfileRepository.save(profile);
    }

    @Transactional(readOnly = true)
    public CustomerProfile getProfileByUserId(Long userId) {
        return customerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("Customer profile not found for user ID: " + userId));
    }

    @Transactional
    public CustomerProfile updateDefaultAddress(Long userId, Address newAddress) {
        CustomerProfile profile = getProfileByUserId(userId);
        profile.setDefaultAddress(newAddress);
        return customerProfileRepository.save(profile);
    }
}