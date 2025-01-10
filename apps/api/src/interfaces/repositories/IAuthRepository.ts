import type { RegisterDTO } from "../../application/common/interfaces/auth/IAuthService";
import type { User } from "@prisma/client";

export interface IAuthRepository {
  /**
   * Mendaftarkan pengguna baru
   * @param data - Data registrasi pengguna
   * @param data.fullName - Nama lengkap pengguna
   * @param data.email - Alamat email pengguna
   * @param data.phoneNumber - Nomor telepon pengguna
   * @param data.password - Password yang akan di-hash
   * @returns Promise<User> User yang baru terdaftar
   */
  register(data: RegisterDTO & { defaultRoleId: string }): Promise<User>;

  /**
   * Memverifikasi akun pengguna (email/nomor telepon)
   * @param userId - ID pengguna
   * @param code - Kode OTP verifikasi
   * @param type - Tipe verifikasi (EMAIL/PHONE)
   * @returns Promise<User> Data user yang telah diverifikasi
   * @throws Error jika user tidak ditemukan atau OTP invalid
   */
  verifyAccount(
    userId: string,
    code: string,
    type: "EMAIL" | "PHONE",
  ): Promise<User>;

  /**
   * Logout pengguna dengan menambahkan token ke blacklist
   * @param token - Token yang akan di-blacklist
   * @param userId - ID pengguna
   */
  logout(token: string, userId: string): Promise<void>;

  /**
   * Mengecek validitas token
   * @param token - Token yang akan dicek
   * @returns Promise<boolean> false jika token di blacklist
   */
  isTokenValid(token: string): Promise<boolean>;

  /**
   * Reset password pengguna menggunakan OTP
   * @param userId - ID pengguna
   * @param code - Kode OTP reset password
   * @param newPassword - Password baru yang akan di-hash
   * @returns Promise<User> Data user yang telah diupdate
   * @throws Error jika user tidak ditemukan atau OTP invalid
   */
  resetPassword(
    userId: string,
    code: string,
    newPassword: string,
  ): Promise<User>;

  /**
   * Mengganti password pengguna
   * @param userId - ID pengguna
   * @param oldPassword - Password lama untuk verifikasi
   * @param newPassword - Password baru yang akan di-hash
   * @returns Promise<User> Data user yang telah diupdate
   * @throws Error jika user tidak ditemukan atau password lama salah
   */
  changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<User>;
}
