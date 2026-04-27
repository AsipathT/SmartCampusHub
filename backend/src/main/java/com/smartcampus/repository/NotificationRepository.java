package com.smartcampus.repository;

import com.smartcampus.model.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import java.util.Collection;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    Long countByUserIdAndIsReadFalse(Long userId);
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, String type);
    List<Notification> findByUserIdAndTypeInOrderByCreatedAtDesc(Long userId, Collection<String> types);
    Long countByUserIdAndTypeInAndIsReadFalse(Long userId, Collection<String> types);
}
