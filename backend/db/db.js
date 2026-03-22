import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function connect() {
    try {
        await prisma.$connect();
        console.log("Connected to PostgreSQL with Prisma");
    } catch (error) {
        console.error("Failed to connect to PostgreSQL:", error);
        process.exit(1);
}
}

export { prisma };
export default connect;