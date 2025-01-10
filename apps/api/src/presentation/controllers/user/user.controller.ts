import { Elysia, t } from "elysia";
import {
  logger,
  profileService,
  userService,
} from "../../../infrasturture/ioc/container";

import { AppError } from "../../../interfaces/errors";
import { authMiddleware } from "../../middleware/auth.middleware";

export const UserController = new Elysia({ prefix: "/users" })
  .decorate("profileService", profileService)
  .decorate("userService", userService)
  .decorate("logger", logger)
  .use(authMiddleware)
  .get("/profile", async ({ profileService, authenticatedUser, logger }) => {
    try {
      return await profileService.getProfile(authenticatedUser.id);
    } catch (error) {
      logger.error("Failed to get profile", {
        error,
        userId: authenticatedUser.id,
      });
      throw error instanceof AppError
        ? error
        : new AppError("Failed to get profile", 500);
    }
  })
  .put(
    "/profile",
    async ({ body, profileService, authenticatedUser, logger }) => {
      try {
        return await profileService.updateProfile(authenticatedUser.id, body);
      } catch (error) {
        logger.error("Failed to update profile", {
          error,
          userId: authenticatedUser.id,
          data: body,
        });
        throw error instanceof AppError
          ? error
          : new AppError("Failed to update profile", 500);
      }
    },
    {
      body: t.Object({
        fullName: t.Optional(t.String({ minLength: 2 })),
        phoneNumber: t.Optional(t.String({ minLength: 10 })),
        position: t.Optional(t.String()),
      }),
    },
  );
