import prisma from '../config/database';
import { hashPassword } from '../utils/encryption.util';

async function main() {
	const adminEmail = 'admin@example.com';
	const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
	if (!existing) {
		const password_hash = await hashPassword('Admin123!');
		await prisma.user.create({ data: { email: adminEmail, password_hash, status: 'active', email_verified: true } });
		// eslint-disable-next-line no-console
		console.log('Seeded admin user:', adminEmail);
	} else {
		// eslint-disable-next-line no-console
		console.log('Admin user already exists');
	}
}

main().then(() => process.exit(0)).catch((err) => {
	// eslint-disable-next-line no-console
	console.error(err);
	process.exit(1);
});
