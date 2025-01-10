import { AuthRepository } from "../database/repositories/auth.repository";
import { AuthService } from "../../application/auth/auth.service";
import { BlacklistedTokenRepository } from "../database/repositories/auth/token.repository";
import { Container } from "inversify";
import type { IAuthRepository } from "../../interfaces/repositories/IAuthRepository";
import type { IAuthService } from "../../application/common/interfaces/auth/IAuthService";
import type { IBlacklistedTokenRepository } from "../../interfaces/repositories/IBlacklistedTokenRepository";
import type { ILogger } from "../../interfaces/ILogger";
import type { IOtpRepository } from "../../interfaces/repositories/IOtpRepository";
import type { IOtpService } from "../../application/common/interfaces/auth/IOtpService";
import type { IPasswordPolicy } from "../../application/common/policies/password.policy";
import type { IPrivilegeRepository } from "../../interfaces/repositories/IPrivilegeRepository";
import type { IProfileService } from "../../application/common/interfaces/user/IProfileService";
import type { IRoleRepository } from "../../interfaces/repositories/IRoleRepository";
import type { IRoleService } from "../../application/common/interfaces/role/IRoleService";
import type { ITokenService } from "../../application/common/interfaces/auth/ITokenService";
import type { IUserRepository } from "../../interfaces/repositories/IUserRepository";
import type { IUserService } from "../../application/common/interfaces/user/IUserService";
import { LoggerServiceDev } from "../logger/logger.dev";
import { LoggerServiceProd } from "../logger/logger.prod";
import { OtpRepository } from "../database/repositories/auth/otp.repository";
import { OtpService } from "../../application/auth/otp.service";
import { PasswordPolicy } from "../../application/common/policies/password.policy";
import { PrivilegeRepository } from "../database/repositories/privilege.repository";
import { ProfileService } from "../../application/user/profile.service";
import { RoleRepository } from "../database/repositories/role.repository";
import { RoleService } from "../../application/role/role.service";
import { TYPES } from "../../interfaces/types";
import { TokenService } from "../../application/auth/token.service";
import { UserRepository } from "../database/repositories/user.repository";
import { UserService } from "../../application/user/user.service";

const container = new Container();

// Repositories
container.bind<IOtpRepository>(TYPES.OtpRepository).to(OtpRepository);
container
  .bind<IBlacklistedTokenRepository>(TYPES.BlacklistedTokenRepository)
  .to(BlacklistedTokenRepository);
container.bind<IAuthRepository>(TYPES.AuthRepository).to(AuthRepository);
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<IRoleRepository>(TYPES.RoleRepository).to(RoleRepository);
container
  .bind<IPrivilegeRepository>(TYPES.PrivilegeRepository)
  .to(PrivilegeRepository);

// Services
container.bind<IOtpService>(TYPES.OtpService).to(OtpService);
container.bind<ITokenService>(TYPES.TokenService).to(TokenService);
container.bind<IAuthService>(TYPES.AuthService).to(AuthService);
container.bind<IProfileService>(TYPES.ProfileService).to(ProfileService);
container.bind<IUserService>(TYPES.UserService).to(UserService);
container.bind<IRoleService>(TYPES.RoleService).to(RoleService);

// Policies
container.bind<IPasswordPolicy>(TYPES.PasswordPolicy).to(PasswordPolicy);

// Tools
container
  .bind<ILogger>(TYPES.Logger)
  .to(
    process.env.NODE_ENV === "production"
      ? LoggerServiceProd
      : LoggerServiceDev,
  );

// instances
export const authService = container.get<IAuthService>(TYPES.AuthService);
export const otpService = container.get<IOtpService>(TYPES.OtpService);
export const tokenService = container.get<ITokenService>(TYPES.TokenService);
export const logger = container.get<ILogger>(TYPES.Logger);
export const authRepo = container.get<IAuthRepository>(TYPES.AuthRepository);
export const userRepo = container.get<IUserRepository>(TYPES.UserRepository);
export const profileService = container.get<IProfileService>(
  TYPES.ProfileService,
);
export const userService = container.get<IUserService>(TYPES.UserService);
export const roleService = container.get<IRoleService>(TYPES.RoleService);

export { container };
