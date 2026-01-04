import { InviteStatus, Role, UserStatus } from '@prisma/client';

export type AdminUserViewFilter = 'invited' | 'active' | 'inactive' | 'all';
export type AdminUserSource = 'USER' | 'INVITE';
export type DeliveryChannel = 'email' | 'sms';

export type InviteConflictFlag =
  | { type: 'DEACTIVATED_USER'; userId: number; status: UserStatus }
  | { type: 'DUPLICATE_EMAIL'; inviteIds: number[] };

export interface InviteActionPermissions {
  canResend: boolean;
  canRevoke: boolean;
  maxReminders: number;
  resendEligible: boolean;
  eligibilityReason: string | null;
}

export interface InvitationMetadata {
  sentAt: Date;
  lastSentAt: Date;
  expiresAt: Date;
  reminderCount: number;
  inviter?: {
    id: number;
    name?: string | null;
    role?: Role | null;
  } | null;
  status: InviteStatus;
  revokedAt?: Date | null;
  conflictFlags?: InviteConflictFlag[];
  permissions: InviteActionPermissions;
}

export interface UserInviteRow {
  id: number;
  source: AdminUserSource;
  email: string;
  fullName?: string | null;
  role: Role;
  status: InviteStatus | UserStatus;
  joinedAt?: Date | null;
  lastLogin?: Date | null;
  invitation?: InvitationMetadata | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminUserListResponse {
  data: UserInviteRow[];
  pagination: PaginationMeta;
}

// ────────────────────────────────────────────────────────────────────────────────
// Resend Modal Types (aligned with OpenAPI contracts/openapi-invite-resend.yaml)
// ────────────────────────────────────────────────────────────────────────────────

export interface ResendContextResponse {
  inviteId: number;
  fullName?: string | null;
  email: string;
  status: InviteStatus;
  reminderCount: number;
  reminderCap: number;
  lastSentAt: Date | null;
  lastSentBy: string | null;
  channels: DeliveryChannel[];
  resendEligible: boolean;
  eligibilityReason: string | null;
  inviteUrl: string;
}

export interface ResendSuccessResponse {
  inviteId: number;
  reminderCount: number;
  lastSentAt: Date;
  channels: DeliveryChannel[];
  resendEligible: boolean;
  message: string;
}

export type ResendConflictCode =
  | 'INVITE_ALREADY_ACTIVATED'
  | 'INVITE_REVOKED'
  | 'REMINDER_CAP_REACHED'
  | 'STATUS_CHANGED';

export interface ResendConflictError {
  code: ResendConflictCode;
  message: string;
}

export interface RateLimitError {
  code: 'RATE_LIMIT_EXCEEDED';
  retryAfter: number;
  message?: string;
}
