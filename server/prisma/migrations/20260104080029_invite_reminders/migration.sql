-- AlterTable
ALTER TABLE `Invite` ADD COLUMN `last_sent_by` INTEGER NULL;

-- CreateTable
CREATE TABLE `InviteReminder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invite_id` INTEGER NOT NULL,
    `sent_by` INTEGER NOT NULL,
    `sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `channels` VARCHAR(191) NOT NULL,
    `success` BOOLEAN NOT NULL DEFAULT true,
    `error_code` VARCHAR(191) NULL,

    INDEX `InviteReminder_invite_id_sent_at_idx`(`invite_id`, `sent_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Invite` ADD CONSTRAINT `Invite_last_sent_by_fkey` FOREIGN KEY (`last_sent_by`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InviteReminder` ADD CONSTRAINT `InviteReminder_invite_id_fkey` FOREIGN KEY (`invite_id`) REFERENCES `Invite`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
