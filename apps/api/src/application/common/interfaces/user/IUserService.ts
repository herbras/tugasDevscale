import type { User } from "@prisma/client";

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  position?: string;
}

export interface IUserService {
  findByEmail(email: string): Promise<User | null>;
  findByPhoneNumber(phone: string): Promise<User | null>;
  findByIdentifier(identifier: string): Promise<User | null>;
  deleteUser(userId: string): Promise<void>;
  updateUser(userId: string, data: UpdateUserData): Promise<User>;
}
