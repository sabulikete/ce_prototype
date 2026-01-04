import { InviteStatus, Prisma, PrismaClient, UserStatus } from '@prisma/client';
import {
	AdminUserListResponse,
	AdminUserViewFilter,
	InviteConflictFlag,
	UserInviteRow,
} from '../types/adminUsers';
import { detectInviteConflicts, checkResendEligibility } from './inviteService';
import { inviteConfig } from '../config/invites';

const prisma = new PrismaClient();
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

type ListOptions = {
	view?: string;
	search?: string;
	page?: number;
	pageSize?: number;
};

const normalizeView = (view?: string): AdminUserViewFilter => {
	if (!view) return 'invited';
	const normalized = view.toLowerCase();
	if (normalized === 'active' || normalized === 'inactive' || normalized === 'all') {
		return normalized as AdminUserViewFilter;
	}
	return 'invited';
};

const clampPageSize = (size?: number) => {
	if (!size || Number.isNaN(size)) return DEFAULT_PAGE_SIZE;
	return Math.min(Math.max(size, 10), MAX_PAGE_SIZE);
};

const parsePage = (page?: number) => {
	if (!page || Number.isNaN(page) || page < 1) {
		return 1;
	}
	return page;
};

const buildSearchFilter = (search: string) => {
	if (!search) return undefined;
	return search.trim();
};

const inviteViewStatuses: InviteStatus[] = [InviteStatus.PENDING, InviteStatus.EXPIRED, InviteStatus.REVOKED];

const buildInvitePermissions = (invite: Prisma.InviteGetPayload<{ include: { creator: true } }>) => {
	const eligibility = checkResendEligibility(invite);
	const isAccepted = invite.status === InviteStatus.ACCEPTED;
	const isRevoked = invite.status === InviteStatus.REVOKED;
	return {
		canResend: eligibility.eligible,
		canRevoke: !isAccepted && !isRevoked,
		maxReminders: inviteConfig.reminderCap,
		resendEligible: eligibility.eligible,
		eligibilityReason: eligibility.reason,
	};
};

const mapInviteRow = (
	invite: Prisma.InviteGetPayload<{ include: { creator: true } }>,
	conflictFlags: InviteConflictFlag[],
): UserInviteRow => ({
	id: invite.id,
	source: 'INVITE',
	email: invite.email,
	fullName: invite.name,
	role: invite.role,
	status: invite.status,
	joinedAt: null,
	lastLogin: null,
	invitation: {
		sentAt: invite.created_at,
		lastSentAt: invite.last_sent_at ?? invite.created_at,
		expiresAt: invite.expires_at,
		reminderCount: invite.reminder_count ?? 0,
		inviter: invite.creator
			? { id: invite.creator.id, name: invite.creator.email, role: invite.creator.role }
			: null,
		revokedAt: invite.revoked_at ?? null,
		status: invite.status,
		conflictFlags,
		permissions: buildInvitePermissions(invite),
	},
});

const userRowSelect = Prisma.validator<Prisma.UserSelect>()({
	id: true,
	email: true,
	name: true,
	unit_id: true,
	role: true,
	status: true,
});

type UserRow = Prisma.UserGetPayload<{ select: typeof userRowSelect }>;

const mapUserRow = (user: UserRow): UserInviteRow => ({
	id: user.id,
	source: 'USER',
	email: user.email,
	fullName: user.name,
	role: user.role,
	status: user.status,
	joinedAt: null,
	lastLogin: null,
	invitation: null,
});

type InviteListArgs = {
	page: number;
	pageSize: number;
	search: string;
};

const listInviteRows = async ({ page, pageSize, search }: InviteListArgs): Promise<AdminUserListResponse> => {
	const where: Prisma.InviteWhereInput = {
		status: { in: inviteViewStatuses },
	};

	if (search) {
		where.OR = [{ email: { contains: search } }, { creator: { email: { contains: search } } }];
	}

	const skip = (page - 1) * pageSize;
	const [total, invites] = await prisma.$transaction([
		prisma.invite.count({ where }),
		prisma.invite.findMany({
			where,
			include: { creator: true },
			orderBy: { last_sent_at: 'desc' },
			skip,
			take: pageSize,
		}),
	]);

	const data = await Promise.all(
		invites.map(async (invite) => {
			const conflictFlags = await detectInviteConflicts(invite.email);
			return mapInviteRow(invite, conflictFlags);
		}),
	);

	return {
		data,
		pagination: {
			page,
			pageSize,
			total,
		},
	};
};

type UserListArgs = {
	page: number;
	pageSize: number;
	search: string;
	statuses: UserStatus[];
};

const listUserRows = async ({ page, pageSize, search, statuses }: UserListArgs): Promise<AdminUserListResponse> => {
	const where: Prisma.UserWhereInput = {};
	if (statuses.length) {
		where.status = { in: statuses };
	}
	if (search) {
		where.OR = [{ email: { contains: search } }, { unit_id: { contains: search } }];
	}

	const skip = (page - 1) * pageSize;
	const [total, users] = await prisma.$transaction([
		prisma.user.count({ where }),
		prisma.user.findMany({
			where,
			orderBy: { id: 'desc' },
			skip,
			take: pageSize,
			select: userRowSelect,
		}),
	]);

	return {
		data: users.map(mapUserRow),
		pagination: {
			page,
			pageSize,
			total,
		},
	};
};

export const listAdminUserRows = async (options: ListOptions = {}): Promise<AdminUserListResponse> => {
	const view = normalizeView(options.view);
	const page = parsePage(options.page);
	const pageSize = clampPageSize(options.pageSize);
	const search = buildSearchFilter(options.search || '') || '';

	if (view === 'invited') {
		return listInviteRows({ page, pageSize, search });
	}

	const statuses =
		view === 'inactive'
			? [UserStatus.SUSPENDED, UserStatus.INVITED]
			: view === 'all'
				? [UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.INVITED]
				: [UserStatus.ACTIVE];

	return listUserRows({ page, pageSize, search, statuses });
};
