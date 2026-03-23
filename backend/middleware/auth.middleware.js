import jwt from "jsonwebtoken";
import redisClient from "../services/redis.service.js";

export const authUser = async (req, res, next) => {
    try {
        let token;

        if (req.cookies?.token) {
            token = req.cookies.token;
        } else if (req.headers?.authorization) {
            const parts = req.headers.authorization.split(' ');
            if (parts.length === 2) {
                token = parts[1];
            }
        }

        if (!token) {
            return res.status(401).send({ error: 'Unauthorized User - No Token' });
        }

        const isBlackListed = await redisClient.get(token);
        if (isBlackListed) {
            res.cookie('token', '');
            return res.status(401).send({ error: 'Unauthorized User - Blacklisted' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next();

    } catch (error) {
        console.log("JWT ERROR:", error.message);
        return res.status(401).send({ error: 'Unauthorized User - Invalid Token' });
    }
};