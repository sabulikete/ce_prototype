type ResendChannelPolicy = 'mirror-original' | 'email-only';

type InviteDeliveryChannel = 'email' | 'sms';

const parseNumber = (rawValue: string | undefined, fallback: number) => {
  if (rawValue === undefined) {
    return fallback;
  }
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const reminderCap = parseNumber(process.env.INVITE_REMINDER_CAP ?? process.env.INVITE_MAX_REMINDERS, 3);
const resendRateLimit = parseNumber(process.env.INVITE_RESEND_RATE_LIMIT, 5);

const normalizeChannelPolicy = (raw: string | undefined): ResendChannelPolicy => {
  const normalized = (raw ?? 'mirror-original').toLowerCase();
  return normalized === 'email-only' ? 'email-only' : 'mirror-original';
};

export const inviteConfig = {
  reminderCap,
  resendChannelPolicy: normalizeChannelPolicy(process.env.INVITE_RESEND_CHANNEL_POLICY),
  resendRateLimitPerAdmin: resendRateLimit,
};

const sanitizeChannels = (channels: InviteDeliveryChannel[]): InviteDeliveryChannel[] => {
  if (!channels || channels.length === 0) {
    return ['email'];
  }
  return Array.from(new Set(channels));
};

export const resolveResendChannels = (originalChannels: InviteDeliveryChannel[]) => {
  const sanitized = sanitizeChannels(originalChannels);
  if (inviteConfig.resendChannelPolicy === 'mirror-original') {
    return sanitized;
  }
  return ['email'];
};

export const isReminderCapReached = (reminderCount: number) => reminderCount >= inviteConfig.reminderCap;
