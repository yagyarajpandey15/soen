import { prisma } from "../db/db.js";

class Project {
    static async create(projectData) {
        return await prisma.project.create({
            data: {
                name: projectData.name.toLowerCase().trim(),
                fileTree: projectData.fileTree || {}
            }
        });
    }

    static async findById(id) {
        return await prisma.project.findUnique({
            where: { id },
            include: {
                users: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });
    }

    static async findByName(name) {
        return await prisma.project.findUnique({
            where: { name: name.toLowerCase().trim() }
        });
    }

    static async addUser(projectId, userId) {
        return await prisma.projectUser.create({
            data: {
                projectId,
                userId
            }
        });
    }

    static async removeUser(projectId, userId) {
        return await prisma.projectUser.deleteMany({
            where: { userId, projectId }
        });
    }

    static async updateFileTree(id, fileTree) {
        return await prisma.project.update({
            where: { id },
            data: { fileTree }
        });
    }

    static async findAll() {
        return await prisma.project.findMany({
            include: {
                users: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });
    }

    static async findAllByUserId(userId) {
        return await prisma.project.findMany({
            where: {
                users: {
                    some: { userId }
                }
            },
            include: {
                users: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });
    }

    static async delete(id) {
        return await prisma.project.delete({
            where: { id }
        });
    }
}

export default Project;