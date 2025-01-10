import "reflect-metadata";

import { Elysia, t } from "elysia";
import { authService, logger } from "../../../infrasturture/ioc/container";

import { AppError } from "../../../interfaces/errors";
import { authMiddleware } from "../../middleware/auth.middleware";
import { jwt } from "../../middleware/jwt.middleware";

const setCookieOptions = (refreshToken: string) => ({
  value: refreshToken,
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60,
  path: "/auth",
});

export const AuthController = new Elysia({ prefix: "/auth" })
  .decorate("authService", authService)
  .decorate("logger", logger)
  .use(jwt)
  .post(
    "/login",
    async ({ body, authService, logger, cookie }) => {
      try {
        const result = await authService.login(body.identifier, body.password);
        cookie.refreshToken.set(setCookieOptions(result.tokens.refreshToken));
        return {
          user: result.user,
          accessToken: result.tokens.accessToken,
        };
      } catch (error) {
        logger.error("Login failed", { error, identifier: body.identifier });
        throw error instanceof AppError
          ? error
          : new AppError("Login failed", 500);
      }
    },
    {
      body: t.Object({
        identifier: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
    },
  )
  .post(
    "/register",
    async ({ body, authService, logger, cookie }) => {
      try {
        const result = await authService.register({
          fullName: body.name,
          email: body.email,
          password: body.password,
          phoneNumber: body.phoneNumber,
        });
        cookie.refreshToken.set(setCookieOptions(result.tokens.refreshToken));
        return {
          user: result.user,
          accessToken: result.tokens.accessToken,
        };
      } catch (error) {
        logger.error("Registration failed", { error, email: body.email });
        throw error instanceof AppError
          ? error
          : new AppError("Registration failed", 500);
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({
          description:
            "Password must contain uppercase, lowercase, numbers, and special characters. Minimum length 8 characters.",
        }),
        name: t.String({ minLength: 2 }),
        phoneNumber: t.String({ minLength: 10 }),
      }),
    },
  )
  .use(authMiddleware)
  .post(
    "/logout",
    async ({ authService, cookie, authenticatedUser, getAccessToken }) => {
      try {
        const accessToken = await getAccessToken();
        const refreshToken = cookie.refreshToken?.value;
        if (!refreshToken) throw new AppError("No refresh token found", 401);
        if (!accessToken) throw new AppError("No access token found", 401);

        await authService.logout(
          accessToken,
          refreshToken,
          authenticatedUser.id,
        );
        cookie.refreshToken.remove();
        return { status: 204 };
      } catch (error) {
        logger.error("Logout failed", { error, userId: authenticatedUser.id });
        throw error instanceof AppError
          ? error
          : new AppError("Logout failed", 500);
      }
    },
  )
  .post("/refresh", async ({ getRefreshToken, authService, cookie }) => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new AppError("No refresh token found", 401);
      const result = await authService.refresh(refreshToken);
      cookie.refreshToken.set(setCookieOptions(result.tokens.refreshToken));
      return { accessToken: result.tokens.accessToken };
    } catch (error) {
      logger.error("Token refresh failed", { error });
      throw error instanceof AppError
        ? error
        : new AppError("Token refresh failed", 401);
    }
  });
