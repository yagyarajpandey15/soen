import projectModel from '../models/project.model.js';

export const createProject = async ({
    name, userId
}) => {
    if (!name) {
        throw new Error('Name is required')
    }
    if (!userId) {
        throw new Error('UserId is required')
    }

    let project;
    try {
        project = await projectModel.create({
            name
        });
        
        // Add the user to the project
        await projectModel.addUser(project.id, userId);
        
        // Return the project with users included
        project = await projectModel.findById(project.id);
    } catch (error) {
        if (error.code === 'P2002') {
            throw new Error('Project name already exists');
        }
        throw error;
    }

    return project;

}


export const getAllProjectByUserId = async ({ userId }) => {
    if (!userId) {
        throw new Error('UserId is required')
    }

    return await projectModel.findAllByUserId(userId);
}

export const addUsersToProject = async ({ projectId, users, userId }) => {

    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!users) {
        throw new Error("users are required")
    }

    if (!Array.isArray(users)) {
        throw new Error("users must be an array")
    }

    if (!userId) {
        throw new Error("userId is required")
    }

    // Check if the project exists and user belongs to it
    const project = await projectModel.findById(projectId);

    if (!project) {
        throw new Error("Project not found")
    }

    const userBelongsToProject = project.users.some(projectUser => projectUser.user.id === userId);
    if (!userBelongsToProject) {
        throw new Error("User does not belong to this project")
    }

    // Add users to the project
    for (const userIdToAdd of users) {
        try {
            await projectModel.addUser(projectId, userIdToAdd);
        } catch (error) {
            // Skip if user is already in the project
            if (error.code !== 'P2002') {
                throw error;
            }
        }
    }

    const updatedProject = await projectModel.findById(projectId);
    return updatedProject;

}

export const getProjectById = async ({ projectId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    const project = await projectModel.findById(projectId);
    
    if (!project) {
        throw new Error("Project not found");
    }

    return project;
}

export const updateFileTree = async ({ projectId, fileTree }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!fileTree) {
        throw new Error("fileTree is required")
    }

    const project = await projectModel.updateFileTree(projectId, fileTree);

    return project;
}