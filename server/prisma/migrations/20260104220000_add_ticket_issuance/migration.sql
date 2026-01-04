-- CreateEnum: TicketStatus
-- Note: MySQL uses inline ENUM in column definition, not separate types

-- AlterTable: Event - Add capacity column
ALTER TABLE `Event` ADD COLUMN `capacity` INTEGER NOT NULL DEFAULT 1000;

-- AlterTable: Ticket - Add code column with temporary default for existing rows
ALTER TABLE `Ticket` ADD COLUMN `code` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable: Ticket - Add status column
ALTER TABLE `Ticket` ADD COLUMN `status` ENUM('VALID', 'VOIDED') NOT NULL DEFAULT 'VALID';

-- Backfill existing tickets with unique codes based on id and code_hash
-- Uniqueness guaranteed by id (primary key), code_hash prefix adds readability
UPDATE `Ticket` SET `code` = CONCAT('TKT-', id, '-', LEFT(code_hash, 8)) WHERE `code` = '';

-- Remove the default from code column after backfill
ALTER TABLE `Ticket` ALTER COLUMN `code` DROP DEFAULT;

-- CreateIndex: Add unique constraint on code
CREATE UNIQUE INDEX `Ticket_code_key` ON `Ticket`(`code`);
