import userModel from '../models/user.model.js';
import * as userService from '../services/user.service.js';
import { validationResult } from 'express-validator';
import redisClient from '../services/redis.service.js';

export const createUserController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await userService.createUser(req.body);

        const token = userModel.generateJWT(user);

        delete user.password;

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/"
        });

        res.status(201).json({ user });

    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const loginController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;

        const user = await userModel.findByEmail(email);

        if (!user) {
            return res.status(401).json({ errors: 'Invalid credentials' });
        }

        const isMatch = await userModel.isValidPassword(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ errors: 'Invalid credentials' });
        }

        const token = userModel.generateJWT(user);

        delete user.password;

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/"
        });

        res.status(200).json({ user });

    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }
};

export const profileController = async (req, res) => {
    res.status(200).json({
        user: req.user
    });
};

export const logoutController = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/"
        });

        res.status(200).json({
            message: 'Logged out successfully'
        });

    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }
};

export const getAllUsersController = async (req, res) => {
    try {
        const loggedInUser = await userModel.findByEmail(req.user.email);

        const allUsers = await userService.getAllUsers({ userId: loggedInUser.id });

        return res.status(200).json({
            users: allUsers
        });

    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
};