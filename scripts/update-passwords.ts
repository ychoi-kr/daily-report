import { PrismaClient } from '@prisma/client';
import { PasswordUtil } from '../src/lib/auth/password';

const prisma = new PrismaClient();

async function updatePasswords() {
  try {
    // デフォルトパスワードをハッシュ化
    const defaultPassword = 'password123';
    const hashedPassword = await PasswordUtil.hashPassword(defaultPassword);

    // すべてのユーザーのパスワードを更新
    const users = await prisma.salesPerson.findMany();

    for (const user of users) {
      if (!user.password || user.password === '') {
        await prisma.salesPerson.update({
          where: { salesPersonId: user.salesPersonId },
          data: { password: hashedPassword },
        });
        console.log(`Updated password for user: ${user.email}`);
      }
    }

    console.log('All passwords have been updated successfully');
  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePasswords();
