package com.fooddelivery.repository;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.fooddelivery.entity.Review;

public interface ReviewRepository extends CrudRepository<Review, Long>{
	 List<Review> findByRestaurantId(Long restaurantId);

}
