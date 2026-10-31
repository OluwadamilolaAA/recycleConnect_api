import { z } from "zod";

const approvalStatusSchema = z.enum([
    "PENDING",
    "APPROVED",
    "REJECTED",
    "SUSPENDED",
]);

export type CollectorApplicationStatus = z.infer<
    typeof approvalStatusSchema
>;

export const listCollectorApplicationsSchema = z.object({
    status: approvalStatusSchema.default("PENDING"),

    page: z.coerce
        .number()
        .int()
        .min(1)
        .max(10_000)
        .default(1),

    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(50)
        .default(20),
}).strict();

export const collectorApplicationParamsSchema = z.object({
    collectorId: z.string().uuid(),
});

export const reviewCollectorApplicationSchema =
    z.discriminatedUnion("decision", [
        z.object({
            decision: z.literal("APPROVED"),
        }).strict(),

        z.object({
            decision: z.literal("REJECTED"),

            rejectionReason: z
                .string()
                .trim()
                .min(1, "A rejection reason is required")
                .max(1000),
        }).strict(),
    ]);

export type ReviewCollectorApplicationInput = z.infer<
    typeof reviewCollectorApplicationSchema
>;