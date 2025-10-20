package com.fooddelivery.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module; 
import com.fooddelivery.entity.User;
import com.fooddelivery.enums.RoleType;
import com.fooddelivery.repository.UserRepository;
import com.fooddelivery.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired; // <-- IMPORT THIS
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AppConfig {

    private static final Logger logger = LoggerFactory.getLogger(AppConfig.class);

    // ★★★ STEP 1: INJECT UserService at the CLASS LEVEL ★★★
    // This allows Spring to construct AppConfig first, before needing to resolve
    // the CommandLineRunner's dependencies.
    @Autowired
    private UserService userService;

    // This bean can be created without any dependencies on other services.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.registerModule(new Hibernate6Module());
        return objectMapper;
    }

    // This bean is created AFTER the main application beans (like UserService) exist.
    @Bean
    public CommandLineRunner adminInitializer(
            UserRepository userRepository,
            // ★★★ STEP 2: REMOVE UserService from the PARAMETER LIST ★★★
            @Value("${app.admin.email}") String adminEmail,
            @Value("${app.admin.password}") String adminPassword
    ) {
        return args -> {
            if (userRepository.findByEmail(adminEmail).isEmpty()) {
                logger.info("No admin account found. Creating default admin user...");

                User admin = new User();
                admin.setName("Default Admin");
                admin.setEmail(adminEmail);
                admin.setPassword(adminPassword);
                admin.setRole(RoleType.ADMIN);

                // Now, we use the userService instance that was autowired into the AppConfig class.
                // This breaks the circular dependency.
                userService.createUser(admin);

                logger.info("Default admin user created with email: {}", adminEmail);
            } else {
                logger.info("Admin user already exists. Skipping creation.");
            }
        };
    }
}