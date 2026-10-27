import UnauthorizedError from "../../common/errors/unauthorized.error.js";
import { UserRepository } from "./user.repository.js";

export class UserService{
    constructor(
        private readonly userRepository = new UserRepository()
    ){}

    async getCurrentUser(userId: string){
        const user = await this.userRepository.findPublicUserById(userId)

        if(!user || user.status !== "ACTIVE"){
            throw new UnauthorizedError("Authentication is required")
        }

        return user;
    }
}