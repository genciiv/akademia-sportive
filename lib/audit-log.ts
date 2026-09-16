import {
  Prisma,
} from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const AUDIT_ACTIONS = {
  STAFF_ROLE_CHANGED:
    "STAFF_ROLE_CHANGED",

  STAFF_ACCESS_CHANGED:
    "STAFF_ACCESS_CHANGED",

  STAFF_REMOVED:
    "STAFF_REMOVED",

  STAFF_INVITATION_CREATED:
    "STAFF_INVITATION_CREATED",

  STAFF_INVITATION_RESENT:
    "STAFF_INVITATION_RESENT",

  STAFF_INVITATION_REVOKED:
    "STAFF_INVITATION_REVOKED",

  STAFF_ACCOUNT_LINKED:
    "STAFF_ACCOUNT_LINKED",
} as const;

export type AuditAction =
  (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

type WriteAuditLogInput = {
  academyId: string;

  actorUserId?: string | null;

  action: AuditAction;

  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;

  beforeData?: Prisma.InputJsonValue;
  afterData?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;

  tx?: Prisma.TransactionClient;
};

export async function writeAuditLog(
  input: WriteAuditLogInput
) {
  const db =
    input.tx ?? prisma;

  await db.auditLog.create({
    data: {
      academyId:
        input.academyId,

      actorUserId:
        input.actorUserId ??
        null,

      action:
        input.action,

      entityType:
        input.entityType,

      entityId:
        input.entityId ??
        null,

      entityLabel:
        input.entityLabel ??
        null,

      ...(input.beforeData !==
      undefined
        ? {
            beforeData:
              input.beforeData,
          }
        : {}),

      ...(input.afterData !==
      undefined
        ? {
            afterData:
              input.afterData,
          }
        : {}),

      ...(input.metadata !==
      undefined
        ? {
            metadata:
              input.metadata,
          }
        : {}),
    },
  });
}