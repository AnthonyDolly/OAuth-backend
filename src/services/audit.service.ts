import prisma from '../config/database';

export type AuditEventInput = {
	userId?: string | null;
	action: string;
	resource: string;
	resourceId?: string | null;
	details?: any;
	success: boolean;
	ipAddress?: string | null;
	userAgent?: string | null;
};

export async function recordAuditEvent(event: AuditEventInput) {
	return prisma.auditLog.create({
		data: {
			user_id: event.userId ?? null,
			action: event.action,
			resource: event.resource,
			resource_id: event.resourceId ?? null,
			details: event.details ?? null,
			success: event.success,
			ip_address: event.ipAddress ?? null,
			user_agent: event.userAgent ?? null
		}
	});
}

export async function purgeOldAuditLogs(retentionDays: number): Promise<number> {
	const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
	const res = await prisma.auditLog.deleteMany({ where: { created_at: { lt: cutoff } } });
	return res.count;
}

export default { recordAuditEvent };


