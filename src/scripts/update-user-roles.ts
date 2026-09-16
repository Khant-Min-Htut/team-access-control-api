import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { UsersRepository } from '../users/users.repository.js';
import { RbacRepository } from '../rbac/rbac.repository.js';
import { User } from '../users/entities/user.entity.js';

async function updateUserRoles() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersRepository = app.get(UsersRepository);
  const rbacRepository = app.get(RbacRepository);

  try {
    console.log('Starting user role migration...');

    // Get all users
    const users = await usersRepository.findAll();
    console.log(`Found ${users.length} users to update`);

    // Get RBAC roles
    const adminRole = await rbacRepository.findRoleByName('admin');
    const memberRole = await rbacRepository.findRoleByName('member');
    const viewerRole = await rbacRepository.findRoleByName('viewer');

    if (!adminRole || !memberRole || !viewerRole) {
      throw new Error('Required RBAC roles not found. Please ensure roles are seeded first.');
    }

    let updatedCount = 0;

    for (const user of users) {
      let targetRole: any;

      // Map user role to RBAC role
      switch (user.role) {
        case 'admin':
          targetRole = adminRole;
          break;
        case 'member':
          targetRole = memberRole;
          break;
        case 'viewer':
          targetRole = viewerRole;
          break;
        default:
          targetRole = memberRole;
      }

      // Update user with RBAC role ID
      await usersRepository.update(user.id, { rbacRoleId: targetRole.id });
      updatedCount++;
      console.log(`Updated user ${user.email} with role ${user.role} -> RBAC role ${targetRole.name}`);
    }

    console.log(`Migration completed. Updated ${updatedCount} users.`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

updateUserRoles()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
