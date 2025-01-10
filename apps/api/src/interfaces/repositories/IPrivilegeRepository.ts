import type { Privilege } from "@prisma/client";

export interface IPrivilegeRepository {
  /**
   * Mencari privilege berdasarkan ID
   */
  findById(id: string): Promise<Privilege | null>;

  /**
   * Mencari privilege berdasarkan nama
   */
  findByName(name: string): Promise<Privilege | null>;

  /**
   * Membuat privilege baru
   */
  create(data: {
    privilegeName: string;
    description?: string;
    privilegeGroup?: string;
  }): Promise<Privilege>;

  /**
   * Memperbarui data privilege
   */
  update(
    id: string,
    data: {
      privilegeName?: string;
      description?: string;
      privilegeGroup?: string;
    },
  ): Promise<Privilege>;

  /**
   * Menghapus privilege (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Mengambil daftar privilege dengan paginasi
   */
  findMany(params: {
    skip?: number;
    take?: number;
    search?: string;
    group?: string;
  }): Promise<[Privilege[], number]>;

  /**
   * Menetapkan privilege ke role
   */
  assignToRole(roleId: string, privilegeId: string): Promise<void>;

  /**
   * Mencabut privilege dari role
   */
  removeFromRole(roleId: string, privilegeId: string): Promise<void>;

  /**
   * Mengambil semua privilege yang dimiliki role
   */
  findByRoleId(roleId: string): Promise<Privilege[]>;
}
