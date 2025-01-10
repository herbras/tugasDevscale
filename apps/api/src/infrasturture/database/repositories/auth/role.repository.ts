import type { Role, RolePrivilege } from "@prisma/client";

import { BaseRepository } from "../base.repository";
import type { IRoleRepository } from "../../../../interfaces/repositories/IRoleRepository";
import { injectable } from "inversify";

@injectable()
export class RoleRepository
  extends BaseRepository<Role>
  implements IRoleRepository
{
  async findById(id: string): Promise<Role | null> {
    return await this.prisma.role.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return await this.prisma.role.findFirst({
      where: {
        name,
        deletedAt: null,
      },
    });
  }

  async create(data: {
    name: string;
    description?: string;
  }): Promise<Role> {
    return await this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        roleType: "DEFAULT", // Default role type
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
    },
  ): Promise<Role> {
    return await this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    search?: string;
  }): Promise<[Role[], number]> {
    const { skip = 0, take = 10, search } = params;

    const where = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    };

    const [roles, count] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.role.count({ where }),
    ]);

    return [roles, count];
  }

  async assignToUser(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  async removeFromUser(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: {
        userId,
        roleId,
      },
    });
  }

  async findRolePrivileges(roleId: string): Promise<RolePrivilege[]> {
    return await this.prisma.rolePrivilege.findMany({
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
    const privilege = await this.prisma.rolePrivilege.findFirst({
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
}
