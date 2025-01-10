import { AppError } from "../../interfaces/errors";
import { Elysia } from "elysia";
import { jwt } from "./jwt.middleware";

export const authMiddleware = new Elysia()
  .use(jwt)
  .derive({ as: "scoped" }, async ({ getAccessToken, verifyAccessToken }) => {
    try {
      const token = await getAccessToken();
      const payload = await verifyAccessToken(token);

      if (!payload?.userId) {
        throw new AppError("Invalid token payload", 401);
      }

      return {
        authenticatedUser: {
          id: payload.userId,
        },
      };
    } catch (error) {
      throw error instanceof AppError
        ? error
        : new AppError("Authentication failed", 401);
    }
  });
