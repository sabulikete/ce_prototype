import { InviteStatus, Role, UserStatus } from '@prisma/client';

export type AdminUserViewFilter = 'invited' | 'active' | 'inactive' | 'all';
export type AdminUserSource = 'USER' | 'INVITE';

export type InviteConflictFlag =
  | { type: 'DEACTIVATED_USER'; userId: number; status: UserStatus }
  | { type: 'DUPLICATE_EMAIL'; inviteIds: number[] };

export interface InviteActionPermissions {
  canResend: boolean;
  canRevoke: boolean;
  maxReminders: number;
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
