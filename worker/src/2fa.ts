import {
  generateTOTPSecret,
  generateTOTPUri,
  verifyTOTPCode,
  generateBackupCodes,
  hashBackupCodes,
  verifyPassword,
} from "./auth";
import { withDatabase, AppError, ErrorCode, AuthenticationError } from "./errors";
import { logSecurityEvent } from "./security-audit";

// Cloudflare D1 Database type
type D1Database = any;

export interface Enable2FAResponse {
  success: boolean;
  secret: string;
  qr_uri: string;
  backup_codes: string[];
}

export async function handleEnable2FA(
  db: D1Database,
  customerId: string,
  email: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<Enable2FAResponse> {
  // Generate TOTP secret
  const secret = generateTOTPSecret();
  const qrUri = generateTOTPUri(secret, email, "Insertabot");

  // Generate backup codes
  const backupCodes = await generateBackupCodes(8);
  const hashedBackupCodes = await hashBackupCodes(backupCodes);

  // Store secret and backup codes (but don't enable yet - wait for verification)
  await withDatabase(
    async () =>
      db
        .prepare(
          "UPDATE customers SET totp_secret = ?, backup_codes = ?, updated_at = ? WHERE customer_id = ?"
        )
        .bind(
          secret,
          JSON.stringify(hashedBackupCodes),
          Math.floor(Date.now() / 1000),
          customerId
        )
        .run(),
    "store2FASecret"
  );

  return {
    success: true,
    secret,
    qr_uri: qrUri,
    backup_codes: backupCodes,
  };
}

export interface Verify2FARequest {
  totp_code: string;
}

export async function handleVerify2FA(
  db: D1Database,
  customerId: string,
  request: Verify2FARequest,
  ipAddress: string | null,
  userAgent: string | null
): Promise<{ success: boolean; message: string }> {
  // Get TOTP secret
  const customer = await withDatabase(
    async () =>
      db
        .prepare(
          "SELECT totp_secret, totp_enabled FROM customers WHERE customer_id = ?"
        )
        .bind(customerId)
        .first<{ totp_secret: string | null; totp_enabled: number }>(),
    "get2FASecret"
  );

  if (!customer || !customer.totp_secret) {
    throw new AppError(ErrorCode.INVALID_REQUEST, "2FA not initialized", 400);
  }

  // Verify the code
  const valid = await verifyTOTPCode(customer.totp_secret, request.totp_code);

  if (!valid) {
    await logSecurityEvent(db, {
      customer_id: customerId,
      event_type: "2fa_failed",
      ip_address: ipAddress || undefined,
      user_agent: userAgent || undefined,
      metadata: { context: "enrollment_verification" },
    });

    throw new AuthenticationError(ErrorCode.INVALID_API_KEY, "Invalid 2FA code");
  }

  // Enable 2FA
  await withDatabase(
    async () =>
      db
        .prepare(
          "UPDATE customers SET totp_enabled = 1, updated_at = ? WHERE customer_id = ?"
        )
        .bind(Math.floor(Date.now() / 1000), customerId)
        .run(),
    "enable2FA"
  );

  await logSecurityEvent(db, {
    customer_id: customerId,
    event_type: "2fa_enabled",
    ip_address: ipAddress || undefined,
    user_agent: userAgent || undefined,
  });

  return {
    success: true,
    message: "2FA enabled successfully",
  };
}

export async function handleDisable2FA(
  db: D1Database,
  customerId: string,
  password: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<{ success: boolean; message: string }> {
  // Verify password before disabling 2FA
  const customer = await withDatabase(
    async () =>
      db
        .prepare(
          "SELECT password_hash, password_salt FROM customers WHERE customer_id = ?"
        )
        .bind(customerId)
        .first<{ password_hash: string; password_salt: string }>(),
    "getPasswordForDisable2FA"
  );

  if (!customer) {
    throw new AuthenticationError(ErrorCode.INVALID_API_KEY, "Customer not found");
  }

  const passwordValid = await verifyPassword(
    password,
    customer.password_hash,
    customer.password_salt
  );

  if (!passwordValid) {
    throw new AuthenticationError(ErrorCode.INVALID_API_KEY, "Invalid password");
  }

  // Disable 2FA
  await withDatabase(
    async () =>
      db
        .prepare(
          "UPDATE customers SET totp_enabled = 0, totp_secret = NULL, backup_codes = NULL, updated_at = ? WHERE customer_id = ?"
        )
        .bind(Math.floor(Date.now() / 1000), customerId)
        .run(),
    "disable2FA"
  );

  await logSecurityEvent(db, {
    customer_id: customerId,
    event_type: "2fa_disabled",
    ip_address: ipAddress || undefined,
    user_agent: userAgent || undefined,
  });

  return {
    success: true,
    message: "2FA disabled successfully",
  };
}
