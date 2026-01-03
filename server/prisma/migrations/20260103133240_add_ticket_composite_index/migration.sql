-- CreateIndex
CREATE INDEX `Ticket_event_id_user_id_checked_in_at_voided_at_idx` ON `Ticket`(`event_id`, `user_id`, `checked_in_at`, `voided_at`);
