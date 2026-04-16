package com.smartcampus.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs once on startup to ensure the resources_status_check
 * constraint includes all current enum values (ACTIVE, MAINTENANCE, OUT_OF_SERVICE).
 *
 * Hibernate's ddl-auto=update never modifies existing CHECK constraints,
 * so this must be done manually when new enum values are added.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseMigrationConfig implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            log.info("Running DB migration: fixing resources_status_check constraint...");

            // Drop the old constraint (which excludes MAINTENANCE)
            jdbcTemplate.execute(
                "ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_status_check"
            );

            // Recreate with all three valid statuses
            jdbcTemplate.execute(
                "ALTER TABLE resources ADD CONSTRAINT resources_status_check " +
                "CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE'))"
            );

            log.info("DB migration complete: resources_status_check now includes MAINTENANCE.");
        } catch (Exception e) {
            log.warn("DB migration skipped (constraint may already be correct): {}", e.getMessage());
        }
    }
}
