import type { Request, Response } from "express";
import { AddressService } from "./address.service.js";
import UnauthorizedError from "../../common/errors/unauthorized.error.js";
import { createAddressSchema } from "./address.schema.js";

export class AddressController {
    constructor(
        private readonly addressService = new AddressService()
    ) { }

    create = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required.");
        }

        const data = createAddressSchema.parse(req.body)
        const address = await this.addressService.createAddress(req.auth.userId, data)

        res.set("Cache-Control", "no-store");

        res.status(201).json({
            success: true,
            message: "Address created successfully.",
            data: {
                address,
            },
        });
    }

    list = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required.");
        }

        const addresses = await this.addressService.getMyAddresses(req.auth.userId)

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            data: {
                addresses,
            },
        });
    };
}
