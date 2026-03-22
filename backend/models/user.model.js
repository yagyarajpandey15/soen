import { prisma } from "../db/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

class User {
    static async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    static async create(userData) {
        const hashedPassword = await this.hashPassword(userData.password);
        return await prisma.user.create({
            data: {
                email: userData.email.toLowerCase().trim(),
                password: hashedPassword
            }
        });
    }

    static async findByEmail(email) {
        return await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        });
    }

    static async findById(id) {
        return await prisma.user.findUnique({
            where: { id }
        });
}

    static async isValidPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
}

    static generateJWT(user) {
    return jwt.sign(
            { email: user.email, id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
}

    static async findAll() {
        return await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }
}

export default User;