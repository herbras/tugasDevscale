import type { Prisma, Role, User, UserRole } from "@prisma/client";

export interface IUserRepository {
  findMany(params: {
    skip?: number;
    take?: number;
    search?: string;
    where?: Prisma.UserWhereInput;
  }): Promise<[User[], number]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPhoneNumber(phoneNumber: string): Promise<User | null>;
  findByEmailWithRoles(
    email: string,
  ): Promise<(User & { userRoles: UserRole[] }) | null>;
  findByIdentifier(identifier: string): Promise<User | null>;
  delete(id: string): Promise<void>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
  findByIdWithRoles(id: string): Promise<(User & { roles: Role[] }) | null>;
  isFirstUser(): Promise<boolean>;
}
