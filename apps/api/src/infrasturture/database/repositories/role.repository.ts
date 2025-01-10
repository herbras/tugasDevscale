import type { Prisma, Role, RolePrivilege } from "@prisma/client";

import { BaseRepository } from "./base.repository";
import type { IRoleRepository } from "../../../interfaces/repositories/IRoleRepository";
import { injectable } from "inversify";
import { prisma } from "../../../utils/prisma";

@injectable()
export class RoleRepository
  extends BaseRepository<Role>
  implements IRoleRepository
{
  async findById(id: string): Promise<Role | null> {
    return await prisma.role.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return await prisma.role.findFirst({
      where: {
        name,
        deletedAt: null,
      },
    });
  }

  async create(data: { name: string; description?: string }): Promise<Role> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existingRole = await tx.role.findFirst({
          where: {
            name: data.name,
            deletedAt: null,
          },
        });

        if (existingRole) {
          throw new Error("Role with this name already exists");
        }

        return await tx.role.create({
          data: {
            ...data,
            roleType: "CUSTOM", // Assuming custom roles by default
          },
        });
      });
    } catch (error: unknown) {
      throw new Error(
        `Failed to create role: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async update(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<Role> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existingRole = await tx.role.findUnique({
          where: {
            id,
            deletedAt: null,
          },
        });

        if (!existingRole) {
          throw new Error("Role not found");
        }

        if (data.name) {
          const duplicateRole = await tx.role.findFirst({
            where: {
              name: data.name,
              NOT: { id },
              deletedAt: null,
            },
          });

          if (duplicateRole) {
            throw new Error("Role name already in use");
          }
        }

        return await tx.role.update({
          where: { id },
          data,
        });
      });
    } catch (error) {
      throw new Error(
        `Failed to update role: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const existingRole = await tx.role.findUnique({
          where: {
            id,
            deletedAt: null,
          },
        });

        if (!existingRole) {
          throw new Error("Role not found");
        }

        // Soft delete
        await tx.role.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      });
    } catch (error: unknown) {
      throw new Error(
        `Failed to delete role: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    search?: string;
  }): Promise<[Role[], number]> {
    const { skip = 0, take = 10, search } = params;

    const where: Prisma.RoleWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    };

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.role.count({ where }),
    ]);

    return [roles, total];
  }

  async assignToUser(userId: string, roleId: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: { id: userId },
        });

        const existingRole = await tx.role.findUnique({
          where: { id: roleId },
        });

        if (!existingUser || !existingRole) {
          throw new Error("User or Role not found");
        }

        const existingAssignment = await tx.userRole.findFirst({
          where: {
            userId,
            roleId,
            deletedAt: null,
          },
        });

        if (existingAssignment) {
          throw new Error("Role already assigned to user");
        }

        await tx.userRole.create({
          data: {
            userId,
            roleId,
          },
        });
      });
    } catch (error: unknown) {
      throw new Error(
        `Failed to assign role to user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async removeFromUser(userId: string, roleId: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const userRole = await tx.userRole.findFirst({
          where: {
            userId,
            roleId,
            deletedAt: null,
          },
        });

        if (!userRole) {
          throw new Error("Role assignment not found");
        }

        await tx.userRole.update({
          where: { id: userRole.id },
          data: { deletedAt: new Date() },
        });
      });
    } catch (error: unknown) {
      throw new Error(
        `Failed to remove role from user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findRolePrivileges(roleId: string): Promise<RolePrivilege[]> {
    return await prisma.rolePrivilege.findMany({
      where: {
        roleId,
        deletedAt: null,
      },
      include: {
        privilege: true,
      },
    });
  }

  async hasPrivilege(roleId: string, privilegeName: string): Promise<boolean> {
    const privilege = await prisma.rolePrivilege.findFirst({
      where: {
        roleId,
        deletedAt: null,
        privilege: {
          privilegeName,
          deletedAt: null,
        },
      },
    });

    return !!privilege;
  }

  async getUserCount(roleId: string): Promise<number> {
    return await prisma.userRole.count({
      where: { roleId, deletedAt: null },
    });
  }

  async findDefaultRole(): Promise<Role | null> {
    return await prisma.role.findFirst({
      where: {
        isDefault: true,
        deletedAt: null,
      },
    });
  }
  async findSystemRole(
    name: "SUPER_ADMIN" | "ADMIN" | "USER",
  ): Promise<Role | null> {
    return await prisma.role.findFirst({
      where: {
        name,
        roleType: "SYSTEM",
        deletedAt: null,
      },
    });
  }
}
