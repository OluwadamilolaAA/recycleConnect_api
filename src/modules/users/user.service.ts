import UnauthorizedError from "../../common/errors/unauthorized.error.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import { AuthRepository } from "../auth/auth.repository.js";
import { UserRepository } from "./user.repository.js";

export class UserService {
    constructor(
        private readonly userRepository = new UserRepository(),
        private readonly authRepository = new AuthRepository()
    ) { }

    async getCurrentUser(userId: string) {
        const user = await this.userRepository.findPublicUserById(userId)

        if (!user || user.status !== "ACTIVE") {
            throw new UnauthorizedError("Authentication is required")
        }

        return user;
    }

    async updateProfile(userId: string, name: string) {
        const result = await this.userRepository.updateName(userId, name)

        if (result.count !== 1) {
            throw new UnauthorizedError("Unable to update profile")
        }

        return this.getCurrentUser(userId)
    }

    async changePassword(
        userId: string,
        sessionId: string,
        currentPassword: string,
        newPassword: string,
    ) {
        const user = await this.userRepository.findPasswordForChange(
                userId,
            );

        if (!user) {
            throw new UnauthorizedError("Authentication is required.");
        }

        const currentPasswordIsValid = await verifyPassword(
            currentPassword,
            user.passwordHash,
        );

        if (!currentPasswordIsValid) {
            throw new UnauthorizedError("Current password is incorrect.");
        }

        const newPasswordHash = await hashPassword(newPassword);

        const passwordChanged = await prisma.$transaction(
            async (tx) => {
                await this.authRepository.lockUserForLogin(
                    userId,
                    tx,
                );

                const account = await this.authRepository.findLoginAccountById(
                        userId,
                        tx,
                    );

                if (
                    !account ||
                    account.status !== "ACTIVE" ||
                    !account.emailVerifiedAt
                ) {
                    return false;
                }

                // Confirm the password didn't change after our first check.
                if (account.passwordHash !== user.passwordHash) {
                    return false;
                }

                const activeSession = await this.authRepository.findActiveSession(
                        userId,
                        sessionId,
                        tx,
                    );

                if (!activeSession) {
                    return false;
                }

                const now = new Date();

                await this.authRepository.updatePassword(
                    userId,
                    newPasswordHash,
                    tx,
                );

                await this.authRepository.revokeAllUserSessions(
                    userId,
                    now,
                    tx,
                );

                await this.authRepository.invalidatePasswordResetChallenges(
                    userId,
                    now,
                    tx,
                );

                return true;
            },
        );

        if (!passwordChanged) {
            throw new UnauthorizedError(
                "Unable to change password. Please log in again.",
            );
        }

        return {
            message:
                "Password changed successfully. Please log in again.",
        };
    }
}