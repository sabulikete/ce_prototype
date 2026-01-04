-- AlterTable
ALTER TABLE `Invite`
    ADD COLUMN `status` ENUM('PENDING', 'EXPIRED', 'REVOKED', 'ACCEPTED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `revoked_at` DATETIME(3) NULL,
    ADD COLUMN `reminder_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `last_sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `pending_email_key` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Invite_pending_email_key_key` ON `Invite`(`pending_email_key`);
