package com.fooddelivery.service;

import com.fooddelivery.entity.*;
import com.fooddelivery.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartService {
	 private final CartRepository cartRepository;
	    private final CartItemRepository cartItemRepository;
	    private final UserRepository userRepository;
	    private final CustomerProfileRepository customerProfileRepository;
	    private final MenuItemRepository menuItemRepository;

	    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository, UserRepository userRepository, CustomerProfileRepository customerProfileRepository, MenuItemRepository menuItemRepository) {
	        this.cartRepository = cartRepository;
	        this.cartItemRepository = cartItemRepository;
	        this.userRepository = userRepository;
	        this.customerProfileRepository = customerProfileRepository;
	        this.menuItemRepository = menuItemRepository;
	    }
	    
    /**
     * ★★★ THIS IS THE PRIMARY FIX ★★★
     * This method now uses the 'findCartByUserIdWithDetails' query from the repository.
     * This query eagerly loads all items and menu items, preventing LazyInitializationException.
     */
    @Transactional
    public Cart getCartByUserId(Long userId) {
        // Use the new, efficient query that prevents the crash
        return cartRepository.findCartByUserIdWithDetails(userId)
                .orElseGet(() -> createNewCartForUser(userId)); // Use a helper to create a new cart
    }

    // Helper method to create a new cart if one doesn't exist
    private Cart createNewCartForUser(Long userId) {
        CustomerProfile profile = customerProfileRepository.findByUserId(userId)
            .orElseGet(() -> {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
                CustomerProfile newProfile = new CustomerProfile();
                newProfile.setUser(user);
                return customerProfileRepository.save(newProfile);
            });
        
        Cart newCart = new Cart();
        newCart.setCustomer(profile);
        return cartRepository.save(newCart);
    }

    @Transactional
    public Cart addItemToCart(Long userId, Long menuItemId, int quantity) {
        Cart cart = getCartByUserId(userId); 
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new EntityNotFoundException("Menu Item not found with id: " + menuItemId));

        CartItem existingItem = cart.getItems().stream()
                .filter(item -> item.getMenuItem().getId().equals(menuItemId))
                .findFirst()
                .orElse(null);

        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + quantity);
        } else {
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setMenuItem(menuItem);
            newItem.setQuantity(quantity);
            cart.getItems().add(newItem);
        }
        cartRepository.save(cart);
        return getCartByUserId(userId);
    }
    
    @Transactional
    public Cart removeItemFromCart(Long userId, Long cartItemId) {
        Cart cart = getCartByUserId(userId);
        
        CartItem itemToModify = cart.getItems().stream()
            .filter(item -> item.getId().equals(cartItemId))
            .findFirst()
            .orElseThrow(() -> new EntityNotFoundException("Cart item with id " + cartItemId + " not found in user's cart."));

        if (itemToModify.getQuantity() > 1) {
            itemToModify.setQuantity(itemToModify.getQuantity() - 1);
            cartItemRepository.save(itemToModify);
        } else {
            cart.getItems().remove(itemToModify);
            cartItemRepository.delete(itemToModify); // Explicitly delete the item
        }
        
        return getCartByUserId(userId);
    }

    @Transactional
    public void clearCart(Long userId) {
        Cart cart = getCartByUserId(userId);
        cart.getItems().clear();
        cartRepository.save(cart);
    }
}