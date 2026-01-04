/**
 * Ticket Issuance Constants
 * Central configuration for ticket-related limits and defaults
 */

/**
 * Maximum number of tickets a single user can hold for a single event.
 * This limit is cumulative across all purchases (voided tickets are excluded).
 * @default 50
 */
export const MAX_TICKETS_PER_USER_PER_EVENT = 50;

/**
 * Default global capacity for events when not explicitly set.
 * This is also the default value in the Event.capacity database field.
 * @default 1000
 */
export const DEFAULT_EVENT_CAPACITY = 1000;
