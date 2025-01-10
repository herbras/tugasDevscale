import "reflect-metadata";

import { inject, injectable } from "inversify";
import type { ILogger } from "../../interfaces/ILogger";
import type { IUserRepository } from "../../interfaces/repositories/IUserRepository";
import { TYPES } from "../../interfaces/types";

import { AppError } from "../../interfaces/errors";
import type {
  ProfileResponse,
  UpdateProfileRequest,
} from "../common/interfaces/user/IProfileService";

@injectable()
export class ProfileService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepo: IUserRepository,
    @inject(TYPES.Logger) private readonly logger: ILogger,
  ) {}

  async getProfile(userId: string): Promise<ProfileResponse> {
    try {
      const user = await this.userRepo.findByIdWithRoles(userId);
      if (!user) {
        this.logger.warn("Profile not found", { userId });
        throw new AppError("User not found", 404);
      }

      this.logger.debug("Profile retrieved successfully", { userId });
      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        position: user.position ?? undefined,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        roles: user.roles.map((r) => r.name),
      };
    } catch (error) {
      this.logger.error("Failed to get profile", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to get profile", 500);
    }
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileRequest,
  ): Promise<ProfileResponse> {
    try {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        this.logger.warn("User not found for profile update", { userId });
        throw new AppError("User not found", 404);
      }

      this.logger.debug("Updating profile", { userId, data });
      await this.userRepo.update(userId, data);

      this.logger.info("Profile updated successfully", { userId });
      return this.getProfile(userId);
    } catch (error) {
      this.logger.error("Failed to update profile", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
        data,
      });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to update profile", 500);
    }
  }
}
