package com.fooddelivery.service;

import com.fooddelivery.entity.MenuItem;
import com.fooddelivery.entity.Restaurant;
import com.fooddelivery.repository.MenuItemRepository;
import com.fooddelivery.repository.RestaurantRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;

    public MenuItemService(MenuItemRepository menuItemRepository, RestaurantRepository restaurantRepository) {
        this.menuItemRepository = menuItemRepository;
        this.restaurantRepository = restaurantRepository;
    }

    @Transactional
    public MenuItem addMenuItemToRestaurant(Long restaurantId, MenuItem menuItem) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found with id: " + restaurantId));
        menuItem.setRestaurant(restaurant);
        return menuItemRepository.save(menuItem);
    }

    @Transactional(readOnly = true)
    public List<MenuItem> getAvailableMenuItemsByRestaurant(Long restaurantId) {
        return menuItemRepository.findByRestaurantIdAndAvailableTrue(restaurantId);
    }

    @Transactional
    public void deleteMenuItem(Long menuItemId) {
        if (!menuItemRepository.existsById(menuItemId)) {
            throw new EntityNotFoundException("Menu item not found with id: " + menuItemId);
        }
        menuItemRepository.deleteById(menuItemId);
    }

    @Transactional(readOnly = true)
   	public List<MenuItem> getAllMenuItemsByRestaurant(Long restaurantId) {
   		// This method will find all menu items belonging to a specific restaurant,
           // regardless of their 'available' status.
   		return menuItemRepository.findByRestaurantId(restaurantId);
   	}

    @Transactional
    public MenuItem updateMenuItem(Long itemId, MenuItem menuItemDetails) {
        // 1. Find the existing menu item in the database.
        MenuItem existingMenuItem = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("MenuItem not found with id: " + itemId));

        // 2. Update the fields of the existing item with the new details.
        // We do not update the restaurant, as that should not be changed here.
        existingMenuItem.setName(menuItemDetails.getName());
        existingMenuItem.setDescription(menuItemDetails.getDescription());
        existingMenuItem.setPrice(menuItemDetails.getPrice());
        existingMenuItem.setImageUrl(menuItemDetails.getImageUrl());

        // 3. Save the updated entity back to the database and return it.
        // JPA's save method performs an update if the entity has an ID.
        return menuItemRepository.save(existingMenuItem);
    }

}