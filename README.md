# SmartCampusHub
IT3030 – Programming Applications and Frameworks (2026)
Faculty of Computing – SLIIT

## Project Overview
SmartCampusHub is a full-stack web platform designed to manage university facility bookings and maintenance operations.

This system enables:
- Resource catalogue management
- Booking workflow with conflict validation
- Incident ticket management
- Role-based access control
- Real-time notifications

## Technology Stack

### Backend
- Java 17
- Spring Boot
- Spring Security (OAuth2)
- JPA / Hibernate
- MySQL / PostgreSQL

### Frontend
- React.js
- Axios
- React Router
- Bootstrap / Tailwind CSS

### DevOps
- GitHub
- GitHub Actions (CI pipeline)

---

## Architecture

- MVC Pattern (Backend)
- Layered Architecture
    - Controller Layer
    - Service Layer
    - Repository Layer
- RESTful API Design
- Role-Based Authorization (USER, ADMIN, TECHNICIAN)

---

## Modules

### Module A – Facilities & Assets
CRUD operations for:
- Rooms
- Labs
- Equipment

### Module B – Booking Management
- Booking requests
- Conflict validation
- Approval workflow

### Module C – Maintenance & Ticketing
- Ticket creation
- Image attachments
- Status workflow
- Technician assignment

### Module D – Notifications
- Booking updates
- Ticket updates
- Comment alerts

---

## Authentication & Authorization
- OAuth 2.0 (Google Login)
- JWT-based secured APIs
- Role-based endpoint protection

---

## Testing
- Unit Testing (JUnit)
- API Testing (Postman Collection)
- Integration Testing

---

## Setup Instructions

### Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run