import { Elysia, t } from "elysia";
import {
  authService,
  logger,
  roleService,
} from "../../../infrasturture/ioc/container";

import { AppError } from "../../../interfaces/errors";
import { authMiddleware } from "../../middleware/auth.middleware";

export const RoleController = new Elysia({ prefix: "/roles" })
  .decorate("roleService", roleService)
  .decorate("authService", authService)
  .decorate("logger", logger)
  .get(
    "/",
    async ({ query, roleService, logger }) => {
      try {
        return await roleService.getRoles({
          skip: Number(query?.skip) || 0,
          take: Number(query?.take) || 10,
          search: query?.search,
        });
      } catch (error) {
        logger.error("Failed to get roles", { error, query });
        throw error instanceof AppError
          ? error
          : new AppError("Failed to get roles", 500);
      }
    },
    {
      query: t.Object({
        skip: t.Optional(t.String()),
        take: t.Optional(t.String()),
        search: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/:id",
    async ({ params, roleService, logger }) => {
      try {
        return await roleService.getRole(params.id);
      } catch (error) {
        logger.error("Failed to get role", { error, roleId: params.id });
        throw error instanceof AppError
          ? error
          : new AppError("Failed to get role", 500);
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .post(
    "/",
    async ({ body, roleService, logger }) => {
      try {
        return await roleService.createRole(body);
      } catch (error) {
        logger.error("Failed to create role", { error, data: body });
        throw error instanceof AppError
          ? error
          : new AppError("Failed to create role", 500);
      }
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        roleType: t.Optional(t.String()),
      }),
    },
  )
  .put(
    "/:id",
    async ({ params, body, roleService, logger }) => {
      try {
        return await roleService.updateRole(params.id, body);
      } catch (error) {
        logger.error("Failed to update role", {
          error,
          roleId: params.id,
          data: body,
        });
        throw error instanceof AppError
          ? error
          : new AppError("Failed to update role", 500);
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
      }),
    },
  )
  .delete(
    "/:id",
    async ({ params, roleService, logger }) => {
      try {
        await roleService.deleteRole(params.id);
        return { status: 204 };
      } catch (error) {
        logger.error("Failed to delete role", { error, roleId: params.id });
        throw error instanceof AppError
          ? error
          : new AppError("Failed to delete role", 500);
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .post(
    "/:id/users/:userId",
    async ({ params, roleService, logger }) => {
      try {
        return await roleService.assignRolesToUser(params.userId, [params.id]);
      } catch (error) {
        logger.error("Failed to assign role", {
          error,
          roleId: params.id,
          userId: params.userId,
        });
        throw error instanceof AppError
          ? error
          : new AppError("Failed to assign role", 500);
      }
    },
    {
      params: t.Object({
        id: t.String(),
        userId: t.String(),
      }),
    },
  )
  .delete(
    "/:id/users/:userId",
    async ({ params, roleService, logger }) => {
      try {
        await roleService.removeRoleFromUser(params.userId, params.id);
        return { status: 204 };
      } catch (error) {
        logger.error("Failed to remove role", {
          error,
          roleId: params.id,
          userId: params.userId,
        });
        throw error instanceof AppError
          ? error
          : new AppError("Failed to remove role", 500);
      }
    },
    {
      params: t.Object({
        id: t.String(),
        userId: t.String(),
      }),
    },
  )
  .use(authMiddleware)

  .post(
    "/switch/:id",
    async ({ params, roleService, authenticatedUser, logger }) => {
      try {
        return await roleService.switchActiveRole(
          authenticatedUser.id,
          params.id,
        );
      } catch (error) {
        logger.error("Failed to switch role", {
          error,
          roleId: params.id,
          userId: authenticatedUser.id,
        });
        throw error instanceof AppError
          ? error
          : new AppError("Failed to switch role", 500);
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );
