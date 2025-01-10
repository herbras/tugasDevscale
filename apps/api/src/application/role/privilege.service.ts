import "reflect-metadata";

import type { Privilege } from "@prisma/client";
import { inject, injectable } from "inversify";
import type { ILogger } from "../../interfaces/ILogger";
import { AppError } from "../../interfaces/errors";
import type { IPrivilegeRepository } from "../../interfaces/repositories/IPrivilegeRepository";
import type { IRoleRepository } from "../../interfaces/repositories/IRoleRepository";
import { TYPES } from "../../interfaces/types";
import type {
  CreatePrivilegeDTO,
  GetPrivilegesQueryDTO,
  IPrivilegeService,
  PaginatedResult,
  UpdatePrivilegeDTO,
} from "../common/interfaces/privilege/IPrivilegeService";

@injectable()
export class PrivilegeService implements IPrivilegeService {
  constructor(
    @inject(TYPES.PrivilegeRepository)
    private readonly privilegeRepo: IPrivilegeRepository,
    @inject(TYPES.RoleRepository) private readonly roleRepo: IRoleRepository,
    @inject(TYPES.Logger) private readonly logger: ILogger,
  ) {}

  async createPrivilege(data: CreatePrivilegeDTO): Promise<Privilege> {
    try {
      const existingPrivilege = await this.privilegeRepo.findByName(
        data.privilegeName,
      );
      if (existingPrivilege) {
        this.logger.warn("Privilege already exists", {
          name: data.privilegeName,
        });
        throw new AppError("Privilege already exists", 400);
      }

      const privilege = await this.privilegeRepo.create(data);
      this.logger.info("Privilege created successfully", {
        privilegeId: privilege.id,
      });
      return privilege;
    } catch (error) {
      this.logger.error("Failed to create privilege", { error, data });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to create privilege");
    }
  }

  async updatePrivilege(
    id: string,
    data: UpdatePrivilegeDTO,
  ): Promise<Privilege> {
    try {
      const privilege = await this.privilegeRepo.findById(id);
      if (!privilege) {
        this.logger.warn("Privilege not found", { privilegeId: id });
        throw new AppError("Privilege not found", 404);
      }

      const updated = await this.privilegeRepo.update(id, data);
      this.logger.info("Privilege updated successfully", { privilegeId: id });
      return updated;
    } catch (error) {
      this.logger.error("Failed to update privilege", {
        error,
        privilegeId: id,
        data,
      });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to update privilege");
    }
  }

  async deletePrivilege(id: string): Promise<void> {
    try {
      const privilege = await this.privilegeRepo.findById(id);
      if (!privilege) {
        this.logger.warn("Privilege not found", { privilegeId: id });
        throw new AppError("Privilege not found", 404);
      }

      await this.privilegeRepo.delete(id);
      this.logger.info("Privilege deleted successfully", { privilegeId: id });
    } catch (error) {
      this.logger.error("Failed to delete privilege", {
        error,
        privilegeId: id,
      });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to delete privilege");
    }
  }

  async getPrivilege(id: string): Promise<Privilege> {
    try {
      const privilege = await this.privilegeRepo.findById(id);
      if (!privilege) {
        this.logger.warn("Privilege not found", { privilegeId: id });
        throw new AppError("Privilege not found", 404);
      }
      return privilege;
    } catch (error) {
      this.logger.error("Failed to get privilege", { error, privilegeId: id });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to get privilege");
    }
  }

  async getPrivileges(
    query: GetPrivilegesQueryDTO,
  ): Promise<PaginatedResult<Privilege>> {
    try {
      const [privileges, total] = await this.privilegeRepo.findMany(query);
      return {
        data: privileges,
        total,
        page: Math.floor((query.skip ?? 0) / (query.take ?? 10)) + 1,
        limit: query.take ?? 10,
      };
    } catch (error) {
      this.logger.error("Failed to get privileges", { error, query });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to get privileges");
    }
  }

  async assignPrivilegeToRole(
    roleId: string,
    privilegeId: string,
  ): Promise<void> {
    try {
      const role = await this.roleRepo.findById(roleId);
      if (!role) {
        throw new AppError("Role not found", 404);
      }

      const privilege = await this.privilegeRepo.findById(privilegeId);
      if (!privilege) {
        throw new AppError("Privilege not found", 404);
      }

      await this.privilegeRepo.assignToRole(roleId, privilegeId);
      this.logger.info("Privilege assigned successfully", {
        roleId,
        privilegeId,
      });
    } catch (error) {
      this.logger.error("Failed to assign privilege", {
        error,
        roleId,
        privilegeId,
      });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to assign privilege");
    }
  }

  async removePrivilegeFromRole(
    roleId: string,
    privilegeId: string,
  ): Promise<void> {
    try {
      await this.privilegeRepo.removeFromRole(roleId, privilegeId);
      this.logger.info("Privilege removed successfully", {
        roleId,
        privilegeId,
      });
    } catch (error) {
      this.logger.error("Failed to remove privilege", {
        error,
        roleId,
        privilegeId,
      });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to remove privilege");
    }
  }

  async getRolePrivileges(roleId: string): Promise<Privilege[]> {
    try {
      const role = await this.roleRepo.findById(roleId);
      if (!role) {
        throw new AppError("Role not found", 404);
      }

      return await this.privilegeRepo.findByRoleId(roleId);
    } catch (error) {
      this.logger.error("Failed to get role privileges", { error, roleId });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to get role privileges");
    }
  }

  async hasPrivilege(roleId: string, privilegeName: string): Promise<boolean> {
    try {
      return await this.roleRepo.hasPrivilege(roleId, privilegeName);
    } catch (error) {
      this.logger.error("Failed to check privilege", {
        error,
        roleId,
        privilegeName,
      });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to check privilege");
    }
  }
}
