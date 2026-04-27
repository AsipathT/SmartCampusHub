package com.smartcampus.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(nullable = false, length = 100)
    private String type;

    @Column(nullable = false)
    private Long userId; // The user this notification belongs to

    @Column(length = 100)
    private String relatedEntityType;

    @Column
    private Long relatedEntityId;

    @Column(nullable = false)
    private boolean isRead;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
