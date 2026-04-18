package com.smartcampus.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Ensures {@code incident_tickets} has columns for the incident reporting flow
 * (contact + map pin), relaxes legacy NOT NULL on preferred contact, and seeds
 * a realistic Sri Lankan incident-response workforce (5 technicians per category).
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class IncidentTicketSchemaRunner implements ApplicationRunner {

    private static final String DEFAULT_PASSWORD_HASH =
            "$2a$10$9h4n8Jbq/8QqN6Yx7LslF.H8j5Bq3nMc.rD4RuSsvD0o6l4R8Vf6i";

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        alignNotificationsSchema();
        try {
            log.info("Running incident_tickets schema alignment...");
            jdbcTemplate.execute(
                    "ALTER TABLE incident_tickets ADD COLUMN IF NOT EXISTS contact_name VARCHAR(120)"
            );
            jdbcTemplate.execute(
                    "ALTER TABLE incident_tickets ADD COLUMN IF NOT EXISTS contact_number VARCHAR(40)"
            );
            jdbcTemplate.execute(
                    "ALTER TABLE incident_tickets ADD COLUMN IF NOT EXISTS pin_latitude DOUBLE PRECISION"
            );
            jdbcTemplate.execute(
                    "ALTER TABLE incident_tickets ADD COLUMN IF NOT EXISTS pin_longitude DOUBLE PRECISION"
            );
            jdbcTemplate.execute(
                    "ALTER TABLE incident_tickets ALTER COLUMN preferred_contact_details DROP NOT NULL"
            );
            jdbcTemplate.update(
                    "UPDATE incident_tickets SET contact_name = 'Legacy record' WHERE contact_name IS NULL"
            );
            jdbcTemplate.update(
                    "UPDATE incident_tickets SET contact_number = LEFT(COALESCE(NULLIF(TRIM(preferred_contact_details), ''), 'N/A'), 40) "
                            + "WHERE contact_number IS NULL"
            );
            jdbcTemplate.update(
                    "UPDATE incident_tickets SET pin_latitude = 6.9147 WHERE pin_latitude IS NULL"
            );
            jdbcTemplate.update(
                    "UPDATE incident_tickets SET pin_longitude = 79.9723 WHERE pin_longitude IS NULL"
            );
            // The PAF assignment Module C requires the full
            // OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED workflow (with REJECTED).
            // Earlier migrations that collapsed OPEN -> IN_PROGRESS and
            // CLOSED -> RESOLVED were intentionally removed so historical
            // data preserves its original lifecycle state.
            jdbcTemplate.update(
                    "UPDATE incident_tickets SET priority = 'HIGH' WHERE priority = 'CRITICAL'"
            );
            jdbcTemplate.execute(
                    "CREATE TABLE IF NOT EXISTS incident_staff_profiles (" +
                            "id BIGSERIAL PRIMARY KEY, " +
                            "user_id BIGINT NOT NULL UNIQUE, " +
                            "full_name VARCHAR(120) NOT NULL, " +
                            "age INT NOT NULL, " +
                            "qualification VARCHAR(255) NOT NULL, " +
                            "years_of_experience INT NOT NULL, " +
                            "specialist_skills VARCHAR(600) NOT NULL, " +
                            "contact_number VARCHAR(40) NOT NULL, " +
                            "supported_categories VARCHAR(600) NOT NULL, " +
                            "CONSTRAINT fk_incident_staff_profiles_user FOREIGN KEY (user_id) REFERENCES users(id)" +
                            ")"
            );

            jdbcTemplate.update(
                    "DELETE FROM incident_staff_profiles WHERE user_id IN " +
                            "(SELECT id FROM users WHERE username IN " +
                            "('inc_staff_kasun','inc_staff_nadeesha','inc_staff_dulanjan','inc_staff_tharushi'))"
            );

            seedIncidentStaff();

            log.info("incident_tickets schema alignment complete.");
        } catch (Exception e) {
            log.warn("incident_tickets schema alignment skipped: {}", e.getMessage());
        }
    }

    /**
     * Relaxes the legacy {@code notifications} table so the Incident Operations module
     * can actually persist its notification rows. The older schema has a NOT NULL
     * {@code recipient_id} column and a strict CHECK on {@code type} that both reject
     * the incident notification payloads we emit from the ticket service.
     *
     * <p>We keep this defensive (DO blocks) so it is safe on environments where the
     * columns/constraints no longer exist or were renamed.
     */
    private void alignNotificationsSchema() {
        try {
            log.info("Running notifications schema alignment for incident operations...");
            // Make legacy recipient_id column nullable (if it still exists) and backfill it
            // so existing FK/NOT NULL assumptions elsewhere don't break.
            jdbcTemplate.execute(
                    "DO $$ BEGIN " +
                            "  IF EXISTS (SELECT 1 FROM information_schema.columns " +
                            "             WHERE table_name = 'notifications' AND column_name = 'recipient_id') THEN " +
                            "    EXECUTE 'ALTER TABLE notifications ALTER COLUMN recipient_id DROP NOT NULL'; " +
                            "    EXECUTE 'UPDATE notifications SET recipient_id = user_id " +
                            "             WHERE recipient_id IS NULL AND user_id IS NOT NULL'; " +
                            "  END IF; " +
                            "END $$;"
            );

            // Drop ALL CHECK constraints on notifications (usually the legacy type CHECK)
            // so the incident module can insert any type string it needs.
            jdbcTemplate.execute(
                    "DO $$ DECLARE r RECORD; BEGIN " +
                            "  FOR r IN SELECT conname FROM pg_constraint " +
                            "           WHERE conrelid = 'notifications'::regclass AND contype = 'c' LOOP " +
                            "    EXECUTE 'ALTER TABLE notifications DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname); " +
                            "  END LOOP; " +
                            "END $$;"
            );
            log.info("notifications schema alignment complete.");
        } catch (Exception e) {
            log.warn("notifications schema alignment skipped: {}", e.getMessage());
        }
    }

    private void seedIncidentStaff() {
        List<StaffSeed> roster = buildIncidentStaffRoster();
        for (StaffSeed s : roster) {
            try {
                jdbcTemplate.update(
                        "INSERT INTO users (full_name, username, email, password, role, created_at, updated_at) " +
                                "SELECT ?, ?, ?, ?, 'STAFF', NOW(), NOW() " +
                                "WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = ?)",
                        s.fullName, s.username, s.email, DEFAULT_PASSWORD_HASH, s.username
                );
                jdbcTemplate.update(
                        "INSERT INTO incident_staff_profiles " +
                                "(user_id, full_name, age, qualification, years_of_experience, " +
                                " specialist_skills, contact_number, supported_categories) " +
                                "SELECT u.id, ?, ?, ?, ?, ?, ?, ? FROM users u WHERE u.username = ? " +
                                "AND NOT EXISTS (SELECT 1 FROM incident_staff_profiles p WHERE p.user_id = u.id)",
                        s.fullName, s.age, s.qualification, s.years,
                        s.skills, s.contactNumber, s.category, s.username
                );
            } catch (Exception ex) {
                log.warn("Skipping seed for {} ({}): {}", s.fullName, s.username, ex.getMessage());
            }
        }
    }

    private List<StaffSeed> buildIncidentStaffRoster() {
        List<StaffSeed> list = new ArrayList<>();

        String cat = "Electrical / lighting fault";
        list.add(new StaffSeed("Kasun Perera", 36, "NVQ Level 5 in Electrical Technology", 11,
                "Campus electrical diagnostics, emergency lighting restoration, distribution panel safety checks",
                "+94 71 234 5678", cat));
        list.add(new StaffSeed("Ruwan Silva", 42, "City & Guilds Electrical Installation", 18,
                "Industrial wiring, generator synchronization, earthing audits",
                "+94 77 118 2234", cat));
        list.add(new StaffSeed("Chathura Bandara", 29, "BSc Electrical Engineering (SLIIT)", 6,
                "Smart lighting, sensor networks, lab power conditioning",
                "+94 76 445 9912", cat));
        list.add(new StaffSeed("Sahan Jayasuriya", 34, "NVQ Level 6 Electrical Maintenance", 10,
                "Underground cabling, fault diagnosis, RCBO replacements",
                "+94 70 882 3344", cat));
        list.add(new StaffSeed("Nuwan Rajapaksa", 47, "Diploma in Electrical Engineering (UoM)", 22,
                "HV substation maintenance, transformer load balancing",
                "+94 71 667 4411", cat));

        cat = "Plumbing or water leak";
        list.add(new StaffSeed("Dulanjan Wijesinghe", 41, "Higher Diploma in Mechanical Engineering", 15,
                "Plumbing leak containment, pump station repairs, utility pipework",
                "+94 76 456 7890", cat));
        list.add(new StaffSeed("Lalith Gunasekara", 52, "NVQ Level 4 Plumbing", 25,
                "Municipal mains work, pressure testing, pipe relining",
                "+94 77 234 1190", cat));
        list.add(new StaffSeed("Samantha Herath", 38, "NCT Plumbing & Sanitation", 14,
                "Backflow prevention, drainage remediation, hostel block plumbing",
                "+94 71 339 8812", cat));
        list.add(new StaffSeed("Eranga Senanayake", 31, "NVQ Level 5 Plumbing", 9,
                "PEX piping, hot water systems, lab fixture replacement",
                "+94 76 112 5540", cat));
        list.add(new StaffSeed("Amila Karunaratne", 27, "NCT Plumbing", 5,
                "Leak isolation, fixture repair, roof drainage",
                "+94 70 223 7081", cat));

        cat = "AC or ventilation issue";
        list.add(new StaffSeed("Dilshan Abeysekara", 35, "NVQ Level 5 HVAC&R", 12,
                "VRV/chiller systems, cold room servicing, coolant top-ups",
                "+94 71 554 9927", cat));
        list.add(new StaffSeed("Pathum Kumarasinghe", 33, "Diploma in Refrigeration & AC", 10,
                "Split AC diagnostics, compressor rebuilds, inverter units",
                "+94 77 884 2210", cat));
        list.add(new StaffSeed("Roshan Mendis", 46, "Advanced Cert in Building Services", 20,
                "Duct balancing, BMS integration, fresh air handling units",
                "+94 76 667 3301", cat));
        list.add(new StaffSeed("Kavinda Rodrigo", 28, "NVQ Level 4 AC Technology", 5,
                "Preventive servicing, filter overhaul, refrigerant handling",
                "+94 70 112 6683", cat));
        list.add(new StaffSeed("Nimesha Jayasinghe", 30, "NCT HVAC", 7,
                "Ventilation airflow audits, indoor air quality checks",
                "+94 71 903 4812", cat));

        cat = "IT, Wi-Fi, or lab equipment";
        list.add(new StaffSeed("Nadeesha Fernando", 32, "BSc (Hons) in Information Technology", 8,
                "Wi-Fi troubleshooting, CCTV/access control, lab workstation recovery",
                "+94 77 345 6789", cat));
        list.add(new StaffSeed("Ishara Ranasinghe", 29, "BSc (Hons) Computer Systems Engineering", 6,
                "Switches, VLAN segmentation, firewall policies",
                "+94 76 112 7780", cat));
        list.add(new StaffSeed("Sajith Ekanayake", 37, "MSc Network Systems", 13,
                "SD-WAN, campus backbone, failover routing",
                "+94 71 557 4432", cat));
        list.add(new StaffSeed("Dinusha Kariyawasam", 26, "BSc Cyber Security", 4,
                "Endpoint recovery, malware containment, lab imaging",
                "+94 70 889 6651", cat));
        list.add(new StaffSeed("Shehan Pathirana", 33, "BSc IT + CCNP", 10,
                "Unified comms, AV classroom systems, lecture capture",
                "+94 77 778 3329", cat));

        cat = "Furniture, door, or fitting damage";
        list.add(new StaffSeed("Lakmal Edirisinghe", 44, "Certificate in Carpentry (VTA)", 19,
                "Door frames, custom cabinetry, emergency hardware replacements",
                "+94 77 441 5520", cat));
        list.add(new StaffSeed("Sanduni Wickramaratne", 36, "NVQ Level 4 Carpentry", 12,
                "Partitions, wall fittings, laminate repair",
                "+94 71 228 9913", cat));
        list.add(new StaffSeed("Manoj Dias", 40, "NCT Joinery", 16,
                "Hinges, locks, window frame restoration",
                "+94 76 559 2207", cat));
        list.add(new StaffSeed("Chamara Gamage", 31, "NVQ Level 3 Carpentry", 8,
                "Lecture hall furniture repair, desk hardware",
                "+94 70 347 8820", cat));
        list.add(new StaffSeed("Buddika Liyanage", 49, "Diploma Woodwork Technology", 24,
                "Laminate refinishing, structural braces, balustrades",
                "+94 77 664 1180", cat));

        cat = "Cleanliness or hygiene concern";
        list.add(new StaffSeed("Piyumi Amarasinghe", 39, "Certificate in Facilities Hygiene", 14,
                "Sanitation audits, waste segregation, biohazard handling",
                "+94 71 112 3390", cat));
        list.add(new StaffSeed("Hasini Ratnayake", 27, "Diploma Environmental Health", 5,
                "Food-service cleanliness, pantry inspections",
                "+94 76 998 2241", cat));
        list.add(new StaffSeed("Anuradha Weerasinghe", 45, "NVQ Level 4 Housekeeping Ops", 19,
                "Restroom deep cleaning, floor-care chemistry",
                "+94 77 665 4410", cat));
        list.add(new StaffSeed("Dilini Kariyawasam", 33, "Certificate Green Cleaning", 10,
                "Eco-safe cleaning protocols, surface disinfection",
                "+94 70 221 5507", cat));
        list.add(new StaffSeed("Malith Pathirana", 30, "NCT Environmental Services", 7,
                "Emergency spill cleanup, laboratory waste handling",
                "+94 71 554 9018", cat));

        cat = "Security-related concern";
        list.add(new StaffSeed("Sameera Jayawardena", 41, "Diploma in Security Management", 17,
                "Perimeter control, incident response, shift coordination",
                "+94 77 119 4432", cat));
        list.add(new StaffSeed("Upeksha Dias", 37, "BSc Criminal Justice", 12,
                "Investigations, witness liaison, campus risk reports",
                "+94 71 443 8820", cat));
        list.add(new StaffSeed("Prasanna Gunawardena", 48, "Retired Army Major (SLA)", 25,
                "VIP and event security, crowd management",
                "+94 76 332 5510", cat));
        list.add(new StaffSeed("Shanika Herath", 29, "NVQ Level 4 Security Services", 6,
                "Access control, intrusion alarms, visitor vetting",
                "+94 70 778 3321", cat));
        list.add(new StaffSeed("Rajith Rajapaksa", 34, "Diploma Private Investigation", 11,
                "CCTV forensics, threat triage, policy enforcement",
                "+94 77 225 7704", cat));

        cat = "Lift, ramp, or accessibility";
        list.add(new StaffSeed("Harshana Abeywardena", 38, "OEM Certification in Lift Maintenance", 14,
                "KONE and Schindler lifts, traction motor servicing",
                "+94 71 663 9912", cat));
        list.add(new StaffSeed("Kanchana De Silva", 33, "NCT Mechatronics", 9,
                "Lift control PCB diagnostics, door operator tuning",
                "+94 76 114 8820", cat));
        list.add(new StaffSeed("Gihan Senarath", 45, "Higher Diploma Mechanical Engineering", 20,
                "Hydraulic lifts, ramp installations, accessibility retrofits",
                "+94 77 990 1123", cat));
        list.add(new StaffSeed("Niluka Ranasinghe", 31, "NVQ Level 5 Elevator Technology", 8,
                "Emergency rescue operations, brake/sheave replacement",
                "+94 70 445 6681", cat));
        list.add(new StaffSeed("Yasith Bandara", 28, "Certificate in Accessibility Compliance", 5,
                "ADA-style compliance audits, tactile signage installation",
                "+94 71 339 2216", cat));

        cat = "Noise disturbance";
        list.add(new StaffSeed("Thilini Wijesekara", 32, "BSc Environmental Science", 9,
                "Noise level surveys, ordinance compliance",
                "+94 77 223 4416", cat));
        list.add(new StaffSeed("Chamika Abeysinghe", 36, "MSc Acoustics", 13,
                "Auditorium acoustic treatment, sound isolation",
                "+94 71 118 5520", cat));
        list.add(new StaffSeed("Sunil Jayasekara", 54, "Chief Warden (retired)", 28,
                "Dispute mediation, hostel quiet-hour enforcement",
                "+94 76 556 7781", cat));
        list.add(new StaffSeed("Oshadi Perera", 30, "Diploma Event Management", 7,
                "Event amplification compliance, stage setup approvals",
                "+94 70 229 4481", cat));
        list.add(new StaffSeed("Dhammika Fernando", 42, "PG Diploma Occupational Hygiene", 17,
                "Vibration and HVAC noise mitigation, equipment muffling",
                "+94 77 884 6610", cat));

        cat = "Safety hazard (glass, spill, exposed wiring)";
        list.add(new StaffSeed("Tharushi Jayawardena", 29, "BSc Occupational Safety and Health", 6,
                "Hazard risk assessments, incident response coordination",
                "+94 70 567 8901", cat));
        list.add(new StaffSeed("Vishwa Weerasinghe", 34, "NEBOSH IGC certified", 10,
                "Spill response, PPE compliance, contractor safety",
                "+94 71 225 9908", cat));
        list.add(new StaffSeed("Sasindu Edirisinghe", 39, "MSc Safety Engineering", 15,
                "Hazardous materials handling, lab safety audits",
                "+94 77 118 3347", cat));
        list.add(new StaffSeed("Chathuri Bandara", 27, "Diploma Emergency Response", 5,
                "First aid, evacuation coordination, triage",
                "+94 76 443 7720", cat));
        list.add(new StaffSeed("Sagara Kumara", 43, "Certificate Risk Management", 18,
                "High-risk lab and workshop audits, preventive engineering controls",
                "+94 70 991 1182", cat));

        cat = "Fire alarm, extinguisher, or emergency signage";
        list.add(new StaffSeed("Aruna Senanayake", 47, "Fire Officer (SLAF retired)", 24,
                "Suppression systems, kitchen hood fire safety",
                "+94 71 440 8812", cat));
        list.add(new StaffSeed("Dinesh Bandara", 39, "Certificate in Fire Engineering", 14,
                "Panel programming, sprinkler servicing, detector calibration",
                "+94 77 226 9943", cat));
        list.add(new StaffSeed("Shehani Rodrigo", 31, "BEng Fire Safety", 8,
                "Evacuation drills, emergency signage compliance",
                "+94 76 118 5540", cat));
        list.add(new StaffSeed("Ravindu Karunanayake", 28, "NVQ Level 5 Fire Service", 5,
                "Extinguisher service intervals, fire hydrant inspections",
                "+94 70 554 3381", cat));
        list.add(new StaffSeed("Dilhani Samarawickrama", 42, "PG Diploma Fire Investigation", 16,
                "Post-incident investigation, insurance liaison",
                "+94 77 882 1120", cat));

        cat = "Other campus incident";
        list.add(new StaffSeed("Isuru Senarath", 33, "Diploma Facility Management", 10,
                "Cross-discipline incident triage, contractor supervision",
                "+94 71 338 6624", cat));
        list.add(new StaffSeed("Chanaka Kariyawasam", 38, "BSc Estate Management", 13,
                "General utilities coordination, preventive scheduling",
                "+94 76 229 4481", cat));
        list.add(new StaffSeed("Amara Jayasuriya", 30, "MSc Operations Management", 7,
                "Complaints routing, resolution operations",
                "+94 77 554 1190", cat));
        list.add(new StaffSeed("Sudeshna Ratnayake", 26, "BSc Business Management", 4,
                "Student-facing coordination, vendor dispatch",
                "+94 70 118 8840", cat));
        list.add(new StaffSeed("Thanuja Herath", 41, "Diploma Public Administration", 16,
                "Inter-department escalations, compliance follow-up",
                "+94 71 662 7703", cat));

        return list;
    }

    private static class StaffSeed {
        final String fullName;
        final int age;
        final String qualification;
        final int years;
        final String skills;
        final String contactNumber;
        final String category;
        final String username;
        final String email;

        StaffSeed(String fullName, int age, String qualification, int years,
                  String skills, String contactNumber, String category) {
            this.fullName = fullName;
            this.age = age;
            this.qualification = qualification;
            this.years = years;
            this.skills = skills;
            this.contactNumber = contactNumber;
            this.category = category;
            this.username = "incident_" + slug(fullName);
            this.email = slug(fullName).replace('_', '.') + "@smartcampus.lk";
        }

        private static String slug(String name) {
            String cleaned = name.toLowerCase()
                    .replaceAll("[^a-z0-9\\s]", "")
                    .trim()
                    .replaceAll("\\s+", "_");
            return cleaned.length() > 40 ? cleaned.substring(0, 40) : cleaned;
        }
    }
}
