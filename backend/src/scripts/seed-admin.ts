import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import dataSource from '../data-source';
import { AdminUser } from '../modules/admin-auth/entities/admin-user.entity';

// Run via: npm run seed:admin -- --email=you@novapath.ng --password=somethingStrong
// Upserts by email, so re-running with the same email just rotates the password.
async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [key, value] = arg.replace(/^--/, '').split('=');
      return [key, value];
    }),
  );

  const email = args.email?.toLowerCase();
  const password = args.password;

  if (!email || !password) {
    console.error('Usage: npm run seed:admin -- --email=you@novapath.ng --password=somethingStrong');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  await dataSource.initialize();
  const repo = dataSource.getRepository(AdminUser);

  const passwordHash = await bcrypt.hash(password, 10);
  let admin = await repo.findOne({ where: { email } });
  if (admin) {
    admin.passwordHash = passwordHash;
    console.log(`Updated password for existing admin: ${email}`);
  } else {
    admin = repo.create({ email, passwordHash });
    console.log(`Created new admin: ${email}`);
  }
  await repo.save(admin);

  await dataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
