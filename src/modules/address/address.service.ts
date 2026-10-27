import { AddressRepository } from "./address.repository.js";
import type { CreateAddressInput } from "./address.schema.js";

export class AddressService{
    constructor(
        private readonly addressRepository = new AddressRepository()
    ){}

    async createAddress(userId: string, data: CreateAddressInput){
        return this.addressRepository.create(userId, data)
    }

    async getMyAddresses(userId: string){
        return this.addressRepository.findAllByUserId(userId)
    }
}