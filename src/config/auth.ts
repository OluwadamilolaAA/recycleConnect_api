export const AUTH_CONFIG = {
  emailVerificationLifetimeMs: 24 * 60 * 60 * 1000,
  accessTokenLifetimeSeconds: 10 * 60,

  refreshTokenLifetimeMs: 7 * 24 * 60 * 60 * 1000,

  sessionLifetimeMs: 30 * 24 * 60 * 60 * 1000,

  passwordResetOtpLifetimeMs: 10 * 60 * 1000,

  passwordResetMaxAttempts: 5,

  passwordResetResendCooldownMs: 60 * 1000,

  passwordResetTokenLifetimeMs: 5 * 60 * 1000,

  emailVerificationResendCooldownMs: 60 * 1000,
} as const;