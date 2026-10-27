import "dotenv/config";

import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";

async function createAdmin() {
    const name = process.env.ADMIN_NAME?.trim();
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
        throw new Error(
            "ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required.",
        );
    }

    if (name.length < 2 || name.length > 100) {
        throw new Error(
            "Admin name must be between 2 and 100 characters.",
        );
    }

    if (
        password.length < 8 ||
        Buffer.byteLength(password, "utf8") > 72
    ) {
        throw new Error(
            "Admin password must be at least 8 characters and no more than 72 UTF-8 bytes.",
        );
    }

    const existingUser = await prisma.user.findUnique({
        where: {
            email,
        },
        select: {
            id: true,
        },
    });

    if (existingUser) {
        throw new Error(
            "A user with this email already exists. No account was changed.",
        );
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            role: "ADMIN",
            status: "ACTIVE",
            emailVerifiedAt: new Date(),
        },
        select: {
            id: true,
        },
    });

    console.log("Admin account created successfully.");
}

createAdmin()
    .catch((error: unknown) => {
        console.error(
            "Could not create admin:",
            error instanceof Error ? error.message : "Unknown error",
        );

        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });