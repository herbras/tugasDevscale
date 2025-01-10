import type { Prisma, Privilege } from "@prisma/client";

import { BaseRepository } from "./base.repository";
import type { IPrivilegeRepository } from "../../../interfaces/repositories/IPrivilegeRepository";
import { injectable } from "inversify";
import { prisma } from "../../../utils/prisma";

@injectable()
export class PrivilegeRepository
  extends BaseRepository<Privilege>
  implements IPrivilegeRepository
{
  async findById(id: string): Promise<Privilege | null> {
    return await prisma.privilege.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async findByName(name: string): Promise<Privilege | null> {
    return await prisma.privilege.findFirst({
      where: {
        privilegeName: name,
        deletedAt: null,
      },
    });
  }

  async create(data: {
    privilegeName: string;
    description?: string;
    privilegeGroup?: string;
  }): Promise<Privilege> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existingPrivilege = await tx.privilege.findFirst({
          where: {
            privilegeName: data.privilegeName,
            deletedAt: null,
          },
        });

        if (existingPrivilege) {
          throw new Error("Privilege with this name already exists");
        }

        return await tx.privilege.create({ data });
      });
    } catch (error: unknown) {
      throw new Error(
        `Failed to create privilege: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async update(
    id: string,
    data: {
      privilegeName?: string;
      description?: string;
      privilegeGroup?: string;
    },
  ): Promise<Privilege> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existingPrivilege = await tx.privilege.findUnique({
          where: {
            id,
            deletedAt: null,
          },
        });

        if (!existingPrivilege) {
          throw new Error("Privilege not found");
        }

        if (data.privilegeName) {
          const duplicatePrivilege = await tx.privilege.findFirst({
            where: {
              privilegeName: data.privilegeName,
              NOT: { id },
              deletedAt: null,
            },
          });

          if (duplicatePrivilege) {
            throw new Error("Privilege name already in use");
          }
        }

        return await tx.privilege.update({
          where: { id },
          data,
        });
      });
    } catch (error) {
      throw new Error(
        `Failed to update privilege: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const existingPrivilege = await tx.privilege.findUnique({
          where: {
            id,
            deletedAt: null,
          },
        });

        if (!existingPrivilege) {
          throw new Error("Privilege not found");
        }

        // Soft delete
        await tx.privilege.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      });
    } catch (error: unknown) {
      throw new Error(
        `Failed to delete privilege: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    search?: string;
    group?: string;
  }): Promise<[Privilege[], number]> {
    const { skip = 0, take = 10, search, group } = params;

    const where: Prisma.PrivilegeWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { privilegeName: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      ...(group && {
        privilegeGroup: group,
      }),
    };

    const [privileges, total] = await Promise.all([
      prisma.privilege.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.privilege.count({ where }),
    ]);

    return [privileges, total];
  }

  async assignToRole(roleId: string, privilegeId: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const existingRole = await tx.role.findUnique({
          where: {
            id: roleId,
            deletedAt: null,
          },
        });

        const existingPrivilege = await tx.privilege.findUnique({
          where: {
            id: privilegeId,
            deletedAt: null,
          },
        });

        if (!existingRole || !existingPrivilege) {
          throw new Error("Role or Privilege not found");
        }

        const existingAssignment = await tx.rolePrivilege.findFirst({
          where: {
            roleId,
            privilegeId,
            deletedAt: null,
          },
        });

        if (existingAssignment) {
          throw new Error("Privilege already assigned to role");
        }

        await tx.rolePrivilege.create({
          data: {
            roleId,
            privilegeId,
          },
        });
      });
    } catch (error: unknown) {
      throw new Error(
        `Failed to assign privilege to role: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async removeFromRole(roleId: string, privilegeId: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const rolePrivilege = await tx.rolePrivilege.findFirst({
          where: {
            roleId,
            privilegeId,
            deletedAt: null,
          },
        });

        if (!rolePrivilege) {
          throw new Error("Privilege assignment not found");
        }

        await tx.rolePrivilege.update({
          where: { id: rolePrivilege.id },
          data: { deletedAt: new Date() },
        });
      });
    } catch (error: unknown) {
      throw new Error(
        `Failed to remove privilege from role: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findByRoleId(roleId: string): Promise<Privilege[]> {
    const rolePrivileges = await prisma.rolePrivilege.findMany({
      where: {
        roleId,
        deletedAt: null,
      },
      include: {
        privilege: true,
      },
    });

    return rolePrivileges.map((rp) => rp.privilege);
  }
}
