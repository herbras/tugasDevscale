import type { Role, User } from "@prisma/client";

export interface CreateRoleDTO {
  name: string;
  description?: string;
  roleType?: string;
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
}

export interface GetRolesQueryDTO {
  search?: string;
  skip?: number;
  take?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface IRoleService {
  createRole(data: CreateRoleDTO): Promise<Role>;
  updateRole(id: string, data: UpdateRoleDTO): Promise<Role>;
  deleteRole(id: string): Promise<void>;
  getRole(id: string): Promise<Role>;
  getRoles(query: GetRolesQueryDTO): Promise<PaginatedResult<Role>>;

  // Role assignment
  assignRolesToUser(
    userId: string,
    roleIds: string[],
  ): Promise<{
    user: User;
    roles: Role[];
  }>;
  removeRoleFromUser(userId: string, roleId: string): Promise<void>;
  switchActiveRole(
    userId: string,
    roleId: string,
  ): Promise<{
    user: User;
    accessToken: string;
  }>;
}
