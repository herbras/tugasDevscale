import "reflect-metadata";

import { inject, injectable } from "inversify";
import { logger } from "../../infrasturture/ioc/container";
import { AppError } from "../../interfaces/errors";
import type { IAuthRepository } from "../../interfaces/repositories/IAuthRepository";
import type { IRoleRepository } from "../../interfaces/repositories/IRoleRepository";
import type { IUserRepository } from "../../interfaces/repositories/IUserRepository";
import { TYPES } from "../../interfaces/types";
import type {
  IAuthService,
  LoginResponse,
} from "../common/interfaces/auth/IAuthService";
import type { IOtpService } from "../common/interfaces/auth/IOtpService";
import type { ITokenService } from "../common/interfaces/auth/ITokenService";
import type { IPasswordPolicy } from "../common/policies/password.policy";

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.AuthRepository) private readonly authRepo: IAuthRepository,
    @inject(TYPES.OtpService) private readonly otpService: IOtpService,
    @inject(TYPES.TokenService) private readonly tokenService: ITokenService,
    @inject(TYPES.UserRepository) private readonly userRepo: IUserRepository,
    @inject(TYPES.RoleRepository) private readonly roleRepo: IRoleRepository,
    @inject(TYPES.PasswordPolicy)
    private readonly passwordPolicy: IPasswordPolicy,
  ) {}

  async register(data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
  }): Promise<LoginResponse> {
    try {
      const existingEmail = await this.userRepo.findByIdentifier(data.email);
      if (existingEmail) {
        throw new AppError("Email already registered", 400);
      }

      const existingPhone = await this.userRepo.findByIdentifier(
        data.phoneNumber,
      );
      if (existingPhone) {
        throw new AppError("Phone number already registered", 400);
      }
      const isFirstUser = await this.userRepo.isFirstUser();
      const role = isFirstUser
        ? await this.roleRepo.findSystemRole("SUPER_ADMIN")
        : await this.roleRepo.findDefaultRole();

      if (!role) {
        throw new AppError("Default role not found", 500);
      }

      this.passwordPolicy.validatePasswordStrength(data.password);

      const user = await this.authRepo.register({
        ...data,
        defaultRoleId: role.id,
      });
      await this.roleRepo.assignToUser(user.id, role.id);

      const tokens = await this.tokenService.generateTokens({
        userId: user.id,
      });

      await Promise.all([
        this.otpService.generate(user.id, user.email, "REGISTRATION"),
        this.otpService.generate(user.id, user.phoneNumber, "REGISTRATION"),
      ]);
      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          position: user.position,
          defaultRoleId: user.defaultRoleId,
          status: {
            isActive: user.isActive,
            verification: {
              status: user.verificationStatus,
              email: user.isEmailVerified,
              phone: user.isPhoneVerified,
            },
          },
        },
        tokens,
      };
    } catch (error) {
      logger.error("Registration failed", { error });
      throw error instanceof AppError
        ? error
        : new AppError("Registration failed", 500);
    }
  }

  async verifyAccount(userId: string, code: string, type: "EMAIL" | "PHONE") {
    return await this.authRepo.verifyAccount(userId, code, type);
  }

  async login(identifier: string, password: string) {
    try {
      const user = await this.userRepo.findByIdentifier(identifier);
      if (!user) throw new AppError("Invalid credentials", 401);

      const isValid = await Bun.password.verify(password, user.password);
      if (!isValid) throw new AppError("Invalid credentials", 401);

      const tokens = await this.tokenService.generateTokens({
        userId: user.id,
      });

      return {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          position: user.position,
          defaultRoleId: user.defaultRoleId,
          status: {
            isActive: user.isActive,
            verification: {
              status: user.verificationStatus,
              email: user.isEmailVerified,
              phone: user.isPhoneVerified,
            },
          },
        },
        tokens,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Login failed", 500);
    }
  }

  async logout(accessToken: string, refreshToken: string, userId: string) {
    try {
      await Promise.all([
        this.tokenService.blacklistToken(accessToken, userId),
        this.tokenService.blacklistToken(refreshToken, userId),
      ]);
    } catch (error) {
      logger.error("Failed to blacklist tokens", { error });
      throw new AppError("Failed to logout", 500);
    }
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      if (!payload.userId) {
        throw new AppError("Invalid refresh token", 401);
      }

      const user = await this.userRepo.findById(payload.userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      const tokens = await this.tokenService.generateTokens({
        userId: user.id,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          position: user.position,
          defaultRoleId: user.defaultRoleId,
          status: {
            isActive: user.isActive,
            verification: {
              status: user.verificationStatus,
              email: user.isEmailVerified,
              phone: user.isPhoneVerified,
            },
          },
        },
        tokens,
      };
    } catch (error) {
      logger.error("Token refresh failed", { error });
      if (error instanceof AppError) throw error;
      throw new AppError("Token refresh failed", 401);
    }
  }

  async resetPassword(userId: string, code: string, newPassword: string) {
    return await this.authRepo.resetPassword(userId, code, newPassword);
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    return await this.authRepo.changePassword(userId, oldPassword, newPassword);
  }

  async checkPrivilege(
    roleId: string,
    actions: string | string[],
  ): Promise<{
    granted: boolean;
    missingPrivileges?: string[];
  }> {
    try {
      const actionList = Array.isArray(actions) ? actions : [actions];
      const missingPrivileges: string[] = [];

      // Validate actions first
      for (const action of actionList) {
        if (typeof action !== "string" || !action.trim()) {
          throw new AppError(`Invalid action: ${action}`, 400);
        }
      }

      // Check privileges concurrently
      const results = await Promise.all(
        actionList.map(async (action) => ({
          action,
          hasPrivilege: await this.roleRepo.hasPrivilege(roleId, action),
        })),
      );

      // Collect missing privileges
      for (const { action, hasPrivilege } of results) {
        if (!hasPrivilege) {
          missingPrivileges.push(action);
        }
      }

      return {
        granted: missingPrivileges.length === 0,
        ...(missingPrivileges.length > 0 && { missingPrivileges }),
      };
    } catch (error) {
      logger.error(`Failed to check privileges for role ${roleId}`, {
        actions: Array.isArray(actions) ? actions : [actions],
        error,
      });

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to check privileges", 500);
    }
  }
}
