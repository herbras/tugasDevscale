import type { Role, RolePrivilege } from "@prisma/client";

export interface IRoleRepository {
  /**
   * Mencari role berdasarkan ID
   * @param id - ID role yang akan dicari
   */
  findById(id: string): Promise<Role | null>;

  /**
   * Mencari role berdasarkan nama
   * @param name - Nama role yang akan dicari
   */
  findByName(name: string): Promise<Role | null>;

  /**
   * Membuat role baru
   * @param data - Data untuk membuat role
   */
  create(data: {
    name: string;
    description?: string;
    roleType?: string;
  }): Promise<Role>;

  /**
   * Memperbarui data role
   * @param id - ID role yang akan diupdate
   * @param data - Data yang akan diupdate
   */
  update(
    id: string,
    data: {
      name?: string;
      description?: string;
    },
  ): Promise<Role>;

  /**
   * Menghapus role (soft delete)
   * @param id - ID role yang akan dihapus
   */
  delete(id: string): Promise<void>;

  /**
   * Mengambil daftar role dengan paginasi
   */
  findMany(params: {
    skip?: number;
    take?: number;
    search?: string;
  }): Promise<[Role[], number]>;

  /**
   * Menetapkan role ke user
   */
  assignToUser(userId: string, roleId: string): Promise<void>;

  /**
   * Mencabut role dari user
   */
  removeFromUser(userId: string, roleId: string): Promise<void>;

  /**
   * Mengambil daftar privilege dari sebuah role
   * @param roleId - ID role yang akan dicek privilegenya
   */
  findRolePrivileges(roleId: string): Promise<RolePrivilege[]>;

  /**
   * Mengecek apakah role memiliki privilege tertentu
   * @param roleId - ID role yang akan dicek
   * @param privilegeName - Nama privilege yang akan dicek
   */
  hasPrivilege(roleId: string, privilegeName: string): Promise<boolean>;

  /**
   * Mengambil jumlah user yang memiliki role tertentu
   * @param roleId - ID role yang akan dicek
   */
  getUserCount(roleId: string): Promise<number>;

  /**
   * Mencari role default
   */
  findDefaultRole(): Promise<Role | null>;

  /**
   * Mencari role system
   */
  findSystemRole(name: "SUPER_ADMIN" | "ADMIN" | "USER"): Promise<Role | null>;
}
