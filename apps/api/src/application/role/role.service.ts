import "reflect-metadata";

import type { Role, User } from "@prisma/client";
import { inject, injectable } from "inversify";
import type { ILogger } from "../../interfaces/ILogger";
import { AppError } from "../../interfaces/errors";
import type { IRoleRepository } from "../../interfaces/repositories/IRoleRepository";
import type { IUserRepository } from "../../interfaces/repositories/IUserRepository";
import { TYPES } from "../../interfaces/types";
import type { ITokenService } from "../common/interfaces/auth/ITokenService";
import type {
  CreateRoleDTO,
  GetRolesQueryDTO,
  IRoleService,
  PaginatedResult,
  UpdateRoleDTO,
} from "../common/interfaces/role/IRoleService";

@injectable()
export class RoleService implements IRoleService {
  constructor(
    @inject(TYPES.RoleRepository) private readonly roleRepo: IRoleRepository,
    @inject(TYPES.UserRepository) private readonly userRepo: IUserRepository,
    @inject(TYPES.TokenService) private readonly tokenService: ITokenService,
    @inject(TYPES.Logger) private readonly logger: ILogger,
  ) {}

  async createRole(data: CreateRoleDTO): Promise<Role> {
    try {
      const existingRole = await this.roleRepo.findByName(data.name);
      if (existingRole) {
        this.logger.warn("Role already exists", { name: data.name });
        throw new AppError("Role already exists", 400);
      }

      const role = await this.roleRepo.create({
        name: data.name,
        description: data.description,
        roleType: data.roleType ?? "CUSTOM",
      });

      this.logger.info("Role created successfully", { roleId: role.id });
      return role;
    } catch (error) {
      this.logger.error("Failed to create role", { error, data });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to create role");
    }
  }

  async updateRole(id: string, data: UpdateRoleDTO): Promise<Role> {
    try {
      const role = await this.roleRepo.findById(id);
      if (!role) {
        this.logger.warn("Role not found", { roleId: id });
        throw new AppError("Role not found", 404);
      }

      // Prevent updating system-defined roles
      if (role.roleType === "SYSTEM") {
        throw new AppError("System roles cannot be modified", 403);
      }

      const updated = await this.roleRepo.update(id, data);
      this.logger.info("Role updated successfully", { roleId: id });
      return updated;
    } catch (error) {
      this.logger.error("Failed to update role", { error, roleId: id, data });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to update role");
    }
  }

  async deleteRole(id: string): Promise<void> {
    try {
      const role = await this.roleRepo.findById(id);
      if (!role) {
        this.logger.warn("Role not found", { roleId: id });
        throw new AppError("Role not found", 404);
      }

      // Prevent deleting system-defined roles
      if (role.roleType === "SYSTEM") {
        throw new AppError("System roles cannot be deleted", 403);
      }

      // Check if role is being used as default role by any user
      const usersWithDefaultRole = await this.userRepo.findMany({
        where: { defaultRoleId: id },
        take: 1,
      });

      if (usersWithDefaultRole.length > 0) {
        throw new AppError(
          "Cannot delete role as it is set as default for some users",
          400,
        );
      }

      await this.roleRepo.delete(id);
      this.logger.info("Role deleted successfully", { roleId: id });
    } catch (error) {
      this.logger.error("Failed to delete role", { error, roleId: id });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to delete role");
    }
  }

  async getRole(
    id: string,
  ): Promise<Role & { _count?: { userRoles: number } }> {
    try {
      const role = await this.roleRepo.findById(id);
      if (!role) {
        this.logger.warn("Role not found", { roleId: id });
        throw new AppError("Role not found", 404);
      }

      // Get count of users with this role
      const userCount = await this.roleRepo.getUserCount(id);
      return { ...role, _count: { userRoles: userCount } };
    } catch (error) {
      this.logger.error("Failed to get role", { error, roleId: id });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to get role");
    }
  }

  async getRoles(query: GetRolesQueryDTO): Promise<PaginatedResult<Role>> {
    try {
      const [roles, total] = await this.roleRepo.findMany(query);
      return {
        data: roles,
        total,
        page: Math.floor((query.skip ?? 0) / (query.take ?? 10)) + 1,
        limit: query.take ?? 10,
      };
    } catch (error) {
      this.logger.error("Failed to get roles", { error, query });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to get roles");
    }
  }

  async assignRolesToUser(
    userId: string,
    roleIds: string[],
  ): Promise<{ user: User; roles: Role[] }> {
    try {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Validate all roles exist before assigning
      for (const roleId of roleIds) {
        const role = await this.roleRepo.findById(roleId);
        if (!role) {
          throw new AppError(`Role not found: ${roleId}`, 404);
        }
      }

      // Remove duplicate roleIds
      const uniqueRoleIds = [...new Set(roleIds)];

      for (const roleId of uniqueRoleIds) {
        await this.roleRepo.assignToUser(userId, roleId);
      }

      const updatedUser = await this.userRepo.findByIdWithRoles(userId);
      const roles = updatedUser?.roles ?? [];

      this.logger.info("Roles assigned successfully", {
        userId,
        roleIds: uniqueRoleIds,
      });
      return { user: updatedUser ?? user, roles };
    } catch (error) {
      this.logger.error("Failed to assign roles", { error, userId, roleIds });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to assign roles");
    }
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      const user = await this.userRepo.findByIdWithRoles(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Check if role is user's default role
      if (user.defaultRoleId === roleId) {
        throw new AppError("Cannot remove default role from user", 400);
      }

      await this.roleRepo.removeFromUser(userId, roleId);
      this.logger.info("Role removed successfully", { userId, roleId });
    } catch (error) {
      this.logger.error("Failed to remove role", { error, userId, roleId });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to remove role");
    }
  }

  async switchActiveRole(
    userId: string,
    roleId: string,
  ): Promise<{ user: User; accessToken: string }> {
    try {
      const user = await this.userRepo.findByIdWithRoles(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Check if user has the role
      const hasRole = user.roles.some((ur) => ur.id === roleId);
      if (!hasRole) {
        throw new AppError("User does not have this role", 403);
      }

      const updatedUser = await this.userRepo.update(userId, {
        defaultRoleId: roleId,
      });

      // Generate new access token with updated role
      const { accessToken } = await this.tokenService.generateTokens({
        userId: updatedUser.id,
      });

      this.logger.info("Active role switched successfully", { userId, roleId });
      return { user: updatedUser, accessToken: accessToken };
    } catch (error) {
      this.logger.error("Failed to switch active role", {
        error,
        userId,
        roleId,
      });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to switch active role");
    }
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    try {
      const user = await this.userRepo.findByIdWithRoles(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      return user.roles;
    } catch (error) {
      this.logger.error("Failed to get user roles", { error, userId });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to get user roles");
    }
  }

  async validateUserRole(userId: string, roleId: string): Promise<boolean> {
    try {
      const user = await this.userRepo.findByIdWithRoles(userId);
      if (!user) {
        return false;
      }

      return user.roles.some((ur) => ur.id === roleId);
    } catch (error) {
      this.logger.error("Failed to validate user role", {
        error,
        userId,
        roleId,
      });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to validate user role");
    }
  }
}
