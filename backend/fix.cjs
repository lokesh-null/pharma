const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    const phones = new Set();
    for (const user of users) {
        if (!user.phone || user.phone === '') {
            await prisma.user.update({ where: { id: user.id }, data: { phone: null } });
        } else if (phones.has(user.phone)) {
            await prisma.user.update({ where: { id: user.id }, data: { phone: null } });
        } else {
            phones.add(user.phone);
        }
    }
    console.log('Fixed duplicate phones');
}

main().catch(console.error).finally(() => prisma.$disconnect());
