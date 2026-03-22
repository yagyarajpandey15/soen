import userModel from '../models/user.model.js';

export const createUser = async ({
    email, password
}) => {

    if (!email || !password) {
        throw new Error('Email and password are required');
    }

    const user = await userModel.create({
        email,
        password
    });

    return user;

}

export const getAllUsers = async ({ userId }) => {
    const users = await userModel.findAll();
    return users.filter(user => user.id !== userId);
}