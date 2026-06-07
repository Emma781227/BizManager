import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

type AuditParams = {
  actorUserId: string;
  ownerUserId: string;
  shopId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId,
        ownerUserId: params.ownerUserId,
        shopId:      params.shopId ?? null,
        action:      params.action,
        entityType:  params.entityType ?? null,
        entityId:    params.entityId ?? null,
        metadata:    params.metadata !== undefined ? (params.metadata as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });
  } catch {
    // Ne jamais planter l'app à cause d'un log
  }
}
