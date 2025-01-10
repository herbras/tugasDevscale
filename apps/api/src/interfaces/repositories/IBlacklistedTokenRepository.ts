import type { BlacklistedToken } from "@prisma/client";

export interface IBlacklistedTokenRepository {
  /**
   * Menambahkan token ke blacklist
   * @param token - Token yang akan di-blacklist
   * @param userId - ID pengguna pemilik token
   * @returns Promise yang resolve ke object BlacklistedToken yang baru dibuat
   */
  add(token: string, userId: string): Promise<BlacklistedToken>;

  /**
   * Mengecek apakah token ada di blacklist
   * @param token - Token yang akan dicek
   * @returns Promise<boolean> true jika token di-blacklist dan belum expired
   */
  isBlacklisted(token: string): Promise<boolean>;

  /**
   * Membersihkan token yang sudah expired dari blacklist
   * @remarks Sebaiknya dijalankan via cron job
   * @returns Promise<void>
   */
  cleanup(): Promise<void>;
}
