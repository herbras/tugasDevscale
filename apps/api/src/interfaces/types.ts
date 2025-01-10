export const TYPES = {
  // Repositories
  OtpRepository: Symbol.for("OtpRepository"),
  BlacklistedTokenRepository: Symbol.for("BlacklistedTokenRepository"),
  UserRepository: Symbol.for("UserRepository"),
  AuthRepository: Symbol.for("AuthRepository"),
  RoleRepository: Symbol.for("RoleRepository"),
  PrivilegeRepository: Symbol.for("PrivilegeRepository"),
  ProfileRepository: Symbol.for("ProfileRepository"),

  // Services
  OtpService: Symbol.for("OtpService"),
  TokenService: Symbol.for("TokenService"),
  AuthService: Symbol.for("AuthService"),
  ProfileService: Symbol.for("ProfileService"),
  UserService: Symbol.for("UserService"),
  RoleService: Symbol.for("RoleService"),

  // Policies
  PasswordPolicy: Symbol.for("PasswordPolicy"),

  // Utils
  Logger: Symbol.for("Logger"),
} as const;
