import { AppError } from "../../interfaces/errors";
import { Elysia } from "elysia";
import { tokenService } from "../../infrasturture/ioc/container";

export const jwt = new Elysia({ name: "jwt" }).derive(
  { as: "global" },
  async ({ headers, cookie }) => {
    const handleAccessToken = async () => {
      const authorization = headers.authorization;
      if (!authorization) {
        throw new AppError("No token provided", 401);
      }

      const token = authorization.split(" ")[1];
      if (!token) {
        throw new AppError("Invalid token format", 401);
      }

      const isBlacklisted = await tokenService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new AppError("Token has been revoked", 401);
      }

      return token;
    };

    return {
      getAccessToken: handleAccessToken,
      getRefreshToken: () => cookie.refreshToken?.value,
      verifyAccessToken: async (token: string) => {
        const payload = await tokenService.verifyAccessToken(token);
        if (!payload?.userId) {
          throw new AppError("Invalid token payload", 401);
        }
        return payload;
      },
    };
  },
);
