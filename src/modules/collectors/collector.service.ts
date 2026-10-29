import NotFoundError from "../../common/errors/not-found.error.js";
import { CollectorRepository } from "./collector.repository.js";

export class CollectorService{
    constructor(
        private readonly collectorRepository = new CollectorRepository()
    ){}

    async submitApplication(userId: string){
        return this.collectorRepository.submitApplicationUserId(userId)
    }

    async getMyApplication(userId: string){
        const application = this.collectorRepository.findApplicationByUserId(userId)

        if(!application){
            throw new NotFoundError("Application not found")
        }

        return application;
    }
}