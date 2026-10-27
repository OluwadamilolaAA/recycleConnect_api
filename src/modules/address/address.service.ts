import NotFoundError from "../../common/errors/not-found.error.js";
import { AddressRepository } from "./address.repository.js";
import type { CreateAddressInput, UpdateAddressInput } from "./address.schema.js";

export class AddressService {
    constructor(
        private readonly addressRepository = new AddressRepository()
    ) { }

    async createAddress(userId: string, data: CreateAddressInput) {
        return this.addressRepository.create(userId, data)
    }

    async getMyAddresses(userId: string) {
        return this.addressRepository.findAllByUserId(userId)
    }

    async getAddress(userId: string, addressId: string) {
        const address = await this.addressRepository.findOwnedAddress(addressId, userId)

        if (!address) {
            throw new NotFoundError("Address not found")
        }

        return address;
    }

    async updateAddress(userId: string, addressId: string, data: UpdateAddressInput) {
        const result = await this.addressRepository.updateOwnedAddress(
            userId,
            addressId,
            data
        )

        if (result.count !== 1) {
            throw new NotFoundError("Address not found.");
        }

        return this.getAddress(addressId, userId);
    }

    async deleteAddress(userId: string, addressId: string){
        const result = await this.addressRepository.deleteOwnedAddress(userId, addressId)

        if(result.count !== 1){
            throw new NotFoundError("Address not found")
        }

        return{ message: "Address deleted successfully"}
    }
}