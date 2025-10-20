package com.fooddelivery.service;

import com.fooddelivery.entity.User;
import com.fooddelivery.enums.RoleType;
import com.fooddelivery.repository.UserRepository;

import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, @Lazy PasswordEncoder passwordEncoder) { // ★★★ STEP 2: ADD @Lazy HERE ★★★
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * This is the method Spring Security uses to authenticate a user.
     * It loads the user from the database by their "username", which in our case is the email.
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // ★★★ THIS IS THE FIX ★★★
        // We find the user by their email. If not found, we throw the required exception.
        // Because your 'User' entity implements 'UserDetails', we can return it directly.
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    /**
     * Creates a new user, ensuring the password is securely encoded.
     */
    @Transactional
    public User createUser(User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new IllegalStateException("Email address already in use.");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }
    
    @Transactional
    public User registerDeliveryPartner(User user) {
        user.setRole(RoleType.DELIVERYMAN);
        // CRITICAL: Set the user to an inactive state for admin approval.
        // The 'available' field is perfect for this.
        user.setAvailable(false); 
        return createUser(user); // Re-uses the main createUser method for password encoding
    }

    /**
     * A helper method to get a user by their ID.
     */
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));
    }

    /**
     * A helper method to get a user by their email.
     */
    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }
    
    
}