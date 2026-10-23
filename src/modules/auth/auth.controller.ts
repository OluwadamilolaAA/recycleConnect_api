import type { Request, Response } from "express";
import { registerSchema, verifyEmailSchema } from "./auth.schema.js";
import { AuthService } from "./auth.service.js";
import { success } from "zod";

export class AuthController{
    constructor(
        private readonly authService = new AuthService()
    ){}

    register = async(req: Request, res: Response) => {
        const data = registerSchema.parse(req.body)

        const result = await this.authService.register(data)

        res.status(200).json({
            success: true,
            ...result
        })
    }

    verifyEmail= async(req: Request, res: Response) => {
        const data = verifyEmailSchema.parse(req.body)

        const result = await this.authService.verifyEmail(data.token)

        res.status(200).json({
            success: true,
            ...result
        })
    }
}