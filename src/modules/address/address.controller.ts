import type { Request, Response } from "express";
import { AddressService } from "./address.service.js";
import UnauthorizedError from "../../common/errors/unauthorized.error.js";
import { addressParamsSchema, createAddressSchema, updateAddressSchema } from "./address.schema.js";
import { success } from "zod";

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

    getOne = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required")
        }

        const { addressId } = addressParamsSchema.parse(req.params)
        const address = await this.addressService.getAddress(req.auth.userId, addressId)

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            data: {
                address,
            },
        });
    }

    update = async (req: Request, res: Response) => {
        if (!req.auth) {
            throw new UnauthorizedError("Authentication is required")
        }

        const { addressId } = addressParamsSchema.parse(req.params);
        const data = updateAddressSchema.parse(req.body);

        const address = await this.addressService.updateAddress(
            addressId,
            req.auth.userId,
            data,
        );

        res.set("Cache-Control", "no-store");

        res.status(200).json({
            success: true,
            message: "Address updated successfully.",
            data: {
                address,
            },
        });
    }

    remove = async(req: Request, res: Response) => {
        if(!req.auth){
            throw new UnauthorizedError("Authentication is required")
        }

        const { addressId } = addressParamsSchema.parse(req.params)

        const address = await this.addressService.deleteAddress(req.auth.userId, addressId)

        res.set("Cache-Control", "no-store");
        res.status(200).json({
            success: true,
            message: "Address deleted successfully"
        })
    }
}
