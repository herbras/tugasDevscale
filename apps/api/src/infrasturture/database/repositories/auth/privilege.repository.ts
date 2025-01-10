import { BaseRepository } from "../base.repository";
import type { IPrivilegeRepository } from "../../../../interfaces/repositories/IPrivilegeRepository";
import type { Privilege } from "@prisma/client";
import { injectable } from "inversify";

@injectable()
export class PrivilegeRepository
  extends BaseRepository<Privilege>
  implements IPrivilegeRepository
{
  async findById(id: string): Promise<Privilege | null> {
    return await this.prisma.privilege.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Privilege | null> {
    return await this.prisma.privilege.findFirst({
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
    return await this.prisma.privilege.create({
      data: {
        privilegeName: data.privilegeName,
        description: data.description,
        privilegeGroup: data.privilegeGroup,
      },
    });
  }

  async update(
    id: string,
    data: {
      privilegeName?: string;
      description?: string;
      privilegeGroup?: string;
    },
  ): Promise<Privilege> {
    return await this.prisma.privilege.update({
      where: { id },
      data: {
        ...(data.privilegeName && { privilegeName: data.privilegeName }),
        ...(data.description && { description: data.description }),
        ...(data.privilegeGroup && { privilegeGroup: data.privilegeGroup }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.privilege.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    search?: string;
    group?: string;
  }): Promise<[Privilege[], number]> {
    const { skip = 0, take = 10, search, group } = params;

    const where = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { privilegeName: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
      ...(group ? { privilegeGroup: group } : {}),
    };

    const [privileges, count] = await Promise.all([
      this.prisma.privilege.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.privilege.count({ where }),
    ]);

    return [privileges, count];
  }

  async assignToRole(roleId: string, privilegeId: string): Promise<void> {
    await this.prisma.rolePrivilege.create({
      data: {
        roleId,
        privilegeId,
      },
    });
  }

  async removeFromRole(roleId: string, privilegeId: string): Promise<void> {
    await this.prisma.rolePrivilege.deleteMany({
      where: {
        roleId,
        privilegeId,
      },
    });
  }

  async findByRoleId(roleId: string): Promise<Privilege[]> {
    const rolePrivileges = await this.prisma.rolePrivilege.findMany({
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
