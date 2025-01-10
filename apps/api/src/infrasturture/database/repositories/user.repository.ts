import type { Prisma, Role, User, UserRole } from "@prisma/client";

import { BaseRepository } from "./base.repository";
import type { IUserRepository } from "../../../interfaces/repositories/IUserRepository";
import { injectable } from "inversify";
import { prisma } from "../../../utils/prisma";

@injectable()
export class UserRepository
  extends BaseRepository<User>
  implements IUserRepository
{
  async findMany(params: {
    skip?: number;
    take?: number;
    search?: string;
    where?: Prisma.UserWhereInput;
  }): Promise<[User[], number]> {
    const { skip = 0, take = 10, search, where: additionalWhere = {} } = params;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...additionalWhere,
      ...(search && {
        OR: [
          { fullName: { contains: search } },
          { email: { contains: search } },
          { phoneNumber: { contains: search } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return [users, total];
  }

  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { email } });
  }

  async findByEmailWithRoles(
    email: string,
  ): Promise<(User & { userRoles: UserRole[] }) | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    } catch (error: unknown) {
      throw new Error(
        `Failed to find user with roles: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findByIdWithRoles(
    id: string,
  ): Promise<(User & { roles: Role[] }) | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      ...user,
      roles: user.userRoles.map((ur) => ur.role),
    };
  }

  async create(data: User): Promise<User> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findFirst({
          where: {
            OR: [{ email: data.email }, { phoneNumber: data.phoneNumber }],
          },
        });

        if (existingUser) {
          throw new Error(
            "User with this email or phone number already exists",
          );
        }

        return await tx.user.create({ data });
      });
    } catch (error: unknown) {
      throw new Error(
        `Failed to create user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Check if user exists
        const existingUser = await tx.user.findUnique({
          where: { id },
        });

        if (!existingUser) {
          throw new Error("User not found");
        }

        // If email or phone is being updated, check for duplicates
        if (data.email || data.phoneNumber) {
          const duplicateUser = await tx.user.findFirst({
            where: {
              OR: [
                data.email ? { email: data.email as string } : {},
                data.phoneNumber
                  ? { phoneNumber: data.phoneNumber as string }
                  : {},
              ],
              NOT: {
                id: id,
              },
            },
          });

          if (duplicateUser) {
            throw new Error("Email or phone number already in use");
          }
        }

        return tx.user.update({
          where: { id },
          data,
        });
      });
    } catch (error) {
      throw new Error(
        `Failed to update user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.userRole.deleteMany({
          where: { userId: id },
        });
        await tx.user.delete({ where: { id } });
      });
    } catch (error: unknown) {
      throw new Error(
        `Failed to delete user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { phoneNumber } });
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    return await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phoneNumber: identifier }],
      },
    });
  }

  async isFirstUser(): Promise<boolean> {
    return await prisma.$transaction(async (tx) => {
      return (await tx.user.count()) === 0;
    });
  }
}
