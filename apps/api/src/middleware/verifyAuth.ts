import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ApiSuccessResponse } from "@repo/types";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;

    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);

        if (typeof decoded === 'object' && 'userId' in decoded) {
            const userId = decoded.userId
            req.userId = userId;
        }

        next();
    } catch (err) {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });
        const response: ApiSuccessResponse = {
            success: true,
            data: null,
            message: "Session expired. You were logged out.",
        };

        return res.status(200).json(response);
    }
};
