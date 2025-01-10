import type { User } from "@prisma/client";

export interface RegisterDTO {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface UserStatus {
  isActive: boolean;
  verification: {
    status: string;
    email: boolean;
    phone: boolean;
  };
}

export interface LoginUserData {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  position: string | null;
  defaultRoleId: string | null;
  status: UserStatus;
}

export interface LoginResponse {
  user: LoginUserData;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface IAuthService {
  register(data: RegisterDTO): Promise<LoginResponse>;
  verifyAccount(
    userId: string,
    code: string,
    type: "EMAIL" | "PHONE",
  ): Promise<User>;
  login(identifier: string, password: string): Promise<LoginResponse>;
  logout(
    accessToken: string,
    refreshToken: string,
    userId: string,
  ): Promise<void>;
  refresh(refreshToken: string): Promise<LoginResponse>;
  resetPassword(
    userId: string,
    code: string,
    newPassword: string,
  ): Promise<User>;
  changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<User>;
  checkPrivilege(
    roleId: string,
    actions: string | string[],
  ): Promise<{
    granted: boolean;
    missingPrivileges?: string[];
  }>;
}
