import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { AuditSeverity } from "@prisma/client";

const AUDIT_KEY = process.env.AUDIT_ENCRYPTION_KEY ?? "iface-audit-key-32-bytes-padding!!";

export function encryptPayload(data: object): string {
  const key = Buffer.from(AUDIT_KEY.slice(0, 32), "utf8");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  severity = "info",
  before,
  after,
  ipAddress,
  userAgent,
  metadata,
}: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  severity?: AuditSeverity;
  before?: object;
  after?: object;
  ipAddress?: string;
  userAgent?: string;
  metadata?: object;
}) {
  const encryptedSig = encryptPayload({ userId, action, entityType, entityId, ts: Date.now() });

  return prisma.auditTrail.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      severity,
      beforeJson: before,
      afterJson: after,
      ipAddress,
      userAgent,
      encryptedSig,
      metadata,
    },
  });
}
