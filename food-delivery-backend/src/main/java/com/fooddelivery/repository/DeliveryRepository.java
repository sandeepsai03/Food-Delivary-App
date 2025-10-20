package com.fooddelivery.repository;

import com.fooddelivery.entity.Delivery;
import com.fooddelivery.enums.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    // --- YOUR EXISTING METHODS (These are all correct) ---
    Optional<Delivery> findByOrderId(Long orderId);
    List<Delivery> findByDeliveryPartnerId(Long deliveryPartnerId);
    List<Delivery> findByStatus(DeliveryStatus status);
    List<Delivery> findByDeliveryPartnerIdAndStatusIn(Long userId, List<DeliveryStatus> activeStatuses);
    Optional<Delivery> findByIdAndDeliveryPartnerId(Long id, Long deliveryPartnerId);
    boolean existsByOrderId(Long orderId);

    // ★★★ ADD THIS NEW METHOD - THIS IS THE FIX ★★★
    /**
     * Finds all available deliveries (status = ASSIGNED, partner = null) and eagerly
     * fetches all the related data that the frontend dashboard needs to display them correctly.
     * This prevents lazy loading exceptions and ensures data is complete.
     */
    @Query("SELECT d FROM Delivery d " +
           "JOIN FETCH d.order o " +
           "JOIN FETCH o.restaurant r " +
           "WHERE d.status = :status AND d.deliveryPartner IS NULL")
    List<Delivery> findAvailableDeliveriesWithDetails(@Param("status") DeliveryStatus status);
    
    @Query("SELECT d FROM Delivery d " +
            "JOIN FETCH d.order o " +
            "JOIN FETCH o.restaurant r " +
            "WHERE d.deliveryPartner.id = :partnerId AND d.status IN ('ACCEPTED', 'PICKED_UP')")
     List<Delivery> findActiveByPartnerIdWithDetails(@Param("partnerId") Long partnerId);
    
    @Query("SELECT d FROM Delivery d " +
            "JOIN FETCH d.order o " +
            "JOIN FETCH o.restaurant r " +
            "WHERE d.deliveryPartner.id = :partnerId " +
            "AND d.status = :status " +
            "AND d.deliveredAt >= :since")
     List<Delivery> findCompletedByPartnerSince(
         @Param("partnerId") Long partnerId,
         @Param("status") DeliveryStatus status,
         @Param("since") OffsetDateTime since
     );
}