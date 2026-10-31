import {ConflictError, ForbiddenError, NotFoundError} from "../../common/errors/index.js";
import { CollectorAdminRepository } from "./collector-admin.repository.js";
import type { CollectorApplicationStatus, ReviewCollectorApplicationInput } from "./collector-admin.schema.js";

export class CollectorAdminService {
    constructor(
        private readonly repository = new CollectorAdminRepository()
    ){}

    async listApplications(
        status: CollectorApplicationStatus,
        page: number,
        limit: number,
    ) {
        const results = await this.repository.listApplications(
            status,
            page,
            limit,
        );

        return {
            applications: results.slice(0, limit),

            pagination: {
                page,
                limit,
                hasNextPage: results.length > limit,
            },
        };
    }

    async reviewApplication(
        collectorId: string,
        adminId: string,
        data: ReviewCollectorApplicationInput,
    ) {
        if (collectorId === adminId) {
            throw new ForbiddenError("You cannot review your own application.");
        }

        const result = await this.repository.reviewPendingApplication({
                collectorId,
                adminId,
                decision: data.decision,

                rejectionReason:
                    data.decision === "REJECTED"
                        ? data.rejectionReason
                        : null,

                reviewedAt: new Date(),
            });

        if (result.count !== 1) {
            const application = await this.repository.findApplication(collectorId);

            if (!application) {
                throw new NotFoundError("Collector application not found.");
            }

            throw new ConflictError(
                "Only pending applications from active collector accounts can be reviewed. Refresh the application list.",
            );
        }

        return {
            message:
                data.decision === "APPROVED"
                    ? "Collector application approved successfully."
                    : "Collector application rejected successfully.",

            approvalStatus: data.decision,
        };
    }
}