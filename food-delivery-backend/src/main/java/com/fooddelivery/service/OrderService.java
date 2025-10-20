package com.fooddelivery.service;

import com.fooddelivery.entity.*;
import com.fooddelivery.enums.DeliveryStatus;
import com.fooddelivery.enums.OrderStatus;
import com.fooddelivery.repository.DeliveryRepository;
import com.fooddelivery.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final CustomerProfileService customerProfileService;
    @Autowired 
    private DeliveryRepository deliveryRepository;

    public OrderService(OrderRepository orderRepository, CartService cartService, CustomerProfileService customerProfileService) {
        this.orderRepository = orderRepository;
        this.cartService = cartService;
        this.customerProfileService = customerProfileService;
    }

    @Transactional
    public Order createOrderFromCart(Long userId) {
        Cart cart = cartService.getCartByUserId(userId);
        if (cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cannot create an order from an empty cart.");
        }

        CustomerProfile customer = customerProfileService.getProfileByUserId(userId);
        Restaurant restaurant = cart.getItems().get(0).getMenuItem().getRestaurant();

        Order order = new Order();
        order.setCustomer(customer);
        order.setRestaurant(restaurant);
        order.setStatus(OrderStatus.PENDING);

        List<OrderItem> orderItems = cart.getItems().stream().map(cartItem -> {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setMenuItem(cartItem.getMenuItem());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setUnitPrice(cartItem.getMenuItem().getPrice());
            orderItem.setLineTotal(orderItem.getUnitPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
            return orderItem;
        }).collect(Collectors.toList());
        
        order.setItems(orderItems);

        BigDecimal total = orderItems.stream()
                .map(OrderItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setTotal(total);

        Order savedOrder = orderRepository.save(order);
        cartService.clearCart(userId);
        return savedOrder;
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, Long restaurantId, OrderStatus newStatus) {
        Order order = orderRepository.findByIdAndRestaurantId(orderId, restaurantId)
                .orElseThrow(() -> new SecurityException("Order #" + orderId + " not found or you do not have permission to access it."));

        if (!order.getStatus().canTransitionTo(newStatus)) {
            throw new IllegalArgumentException("Invalid status transition from " + order.getStatus() + " to " + newStatus);
        }
        
        order.setStatus(newStatus);

        if (newStatus == OrderStatus.READY_FOR_PICKUP) {
            if (order.getDelivery() == null) {
                
                // This validation block is what is currently protecting your application and throwing the exception.
                Restaurant restaurant = Objects.requireNonNull(order.getRestaurant(), "Order #" + orderId + " is corrupt: missing restaurant details.");
                CustomerProfile customer = Objects.requireNonNull(order.getCustomer(), "Order #" + orderId + " is corrupt: missing customer details.");
                
                if (restaurant.getAddress() == null || restaurant.getAddress().getLine1() == null) {
                    throw new IllegalStateException("Cannot create delivery: Restaurant #" + restaurant.getId() + " is missing a complete address.");
                }
                if (customer.getDefaultAddress() == null || customer.getDefaultAddress().getLine1() == null) {
                    throw new IllegalStateException("Cannot create delivery: Customer #" + customer.getId() + " is missing a complete default address.");
                }
                
                Delivery newDelivery = new Delivery();
                newDelivery.setOrder(order);
                newDelivery.setStatus(DeliveryStatus.ASSIGNED);
                newDelivery.setPickupAddress(restaurant.getAddress());
                newDelivery.setDeliveryAddress(customer.getDefaultAddress());
                newDelivery.setPayoutAmount(calculatePayout(order.getTotal()));
                
                order.setDelivery(newDelivery);
            }
        }
        
        return orderRepository.save(order);
    }
    
    private BigDecimal calculatePayout(BigDecimal orderTotal) {
        if (orderTotal == null) return new BigDecimal("30.00");
        BigDecimal payout = orderTotal.multiply(new BigDecimal("0.10"));
        BigDecimal minimumPayout = new BigDecimal("30.00");
        return payout.max(minimumPayout);
    }

    
    @Transactional(readOnly = true)
    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findOrdersByUserIdWithDetails(userId);
    }
    
    /**
     * Fetches orders for a specific restaurant .
     */
    @Transactional(readOnly = true)
    public List<Order> getOrdersByRestaurantId(Long restaurantId) {
        return orderRepository.findByRestaurantId(restaurantId);
    }
    
    @Transactional(readOnly = true)
    public Order getOrderByIdWithDetails(Long orderId) {
               return orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
    }
}