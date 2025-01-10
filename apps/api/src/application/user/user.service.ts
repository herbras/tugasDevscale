import "reflect-metadata";

import type { User } from "@prisma/client";
import { inject, injectable } from "inversify";
import type { ILogger } from "../../interfaces/ILogger";
import { AppError } from "../../interfaces/errors";
import type { IUserRepository } from "../../interfaces/repositories/IUserRepository";
import { TYPES } from "../../interfaces/types";
import type {
  IUserService,
  UpdateUserData,
} from "../common/interfaces/user/IUserService";

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepo: IUserRepository,
    @inject(TYPES.Logger) private readonly logger: ILogger,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.userRepo.findByEmail(email);
      if (!user) {
        this.logger.info("User not found with email", { email });
        return null;
      }
      return user;
    } catch (error) {
      this.logger.error("Error finding user by email", { error, email });
      throw new AppError("Failed to find user", 500);
    }
  }

  async findByPhoneNumber(phone: string): Promise<User | null> {
    try {
      const user = await this.userRepo.findByPhoneNumber(phone);
      if (!user) {
        this.logger.info("User not found with phone", { phone });
        return null;
      }
      return user;
    } catch (error) {
      this.logger.error("Error finding user by phone", { error, phone });
      throw new AppError("Failed to find user", 500);
    }
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    try {
      const user = await this.userRepo.findByIdentifier(identifier);
      if (!user) {
        this.logger.info("User not found with identifier", { identifier });
        return null;
      }
      return user;
    } catch (error) {
      this.logger.error("Error finding user by identifier", {
        error,
        identifier,
      });
      throw new AppError("Failed to find user", 500);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      await this.userRepo.delete(userId);
      this.logger.info("User deleted successfully", { userId });
    } catch (error) {
      this.logger.error("Error deleting user", { error, userId });
      throw new AppError("Failed to delete user", 500);
    }
  }

  private async validateUserUpdate(data: UpdateUserData): Promise<void> {
    if (data.email) {
      const existingUser = await this.userRepo.findByEmail(data.email);
      if (existingUser) {
        throw new AppError("Email already in use", 400);
      }
    }

    if (data.phoneNumber) {
      const existingUser = await this.userRepo.findByPhoneNumber(
        data.phoneNumber,
      );
      if (existingUser) {
        throw new AppError("Phone number already in use", 400);
      }
    }
  }

  async updateUser(userId: string, data: UpdateUserData): Promise<User> {
    try {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      await this.validateUserUpdate(data);

      return await this.userRepo.update(userId, {
        ...data,
        isEmailVerified:
          data.email !== user.email ? false : user.isEmailVerified,
        isPhoneVerified:
          data.phoneNumber !== user.phoneNumber ? false : user.isPhoneVerified,
      });
    } catch (error) {
      this.logger.error("Error updating user", { error, userId, data });
      throw new AppError("Failed to update user", 500);
    }
  }
}
