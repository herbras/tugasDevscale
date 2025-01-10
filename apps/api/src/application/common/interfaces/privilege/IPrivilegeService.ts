import type { Privilege } from "@prisma/client";

export interface CreatePrivilegeDTO {
  privilegeName: string;
  description?: string;
}

export interface UpdatePrivilegeDTO {
  privilegeName?: string;
  description?: string;
}

export interface GetPrivilegesQueryDTO {
  skip?: number;
  take?: number;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface IPrivilegeService {
  createPrivilege(data: CreatePrivilegeDTO): Promise<Privilege>;
  updatePrivilege(id: string, data: UpdatePrivilegeDTO): Promise<Privilege>;
  deletePrivilege(id: string): Promise<void>;
  getPrivilege(id: string): Promise<Privilege>;
  getPrivileges(
    query: GetPrivilegesQueryDTO,
  ): Promise<PaginatedResult<Privilege>>;
  assignPrivilegeToRole(roleId: string, privilegeId: string): Promise<void>;
  removePrivilegeFromRole(roleId: string, privilegeId: string): Promise<void>;
  getRolePrivileges(roleId: string): Promise<Privilege[]>;
  hasPrivilege(roleId: string, privilegeName: string): Promise<boolean>;
}
