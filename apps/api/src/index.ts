import "reflect-metadata";

import { AuthController } from "./presentation/controllers/auth/auth.controller";
import { Elysia } from "elysia";
import { RoleController } from "./presentation/controllers/role/role.controller";
import { UserController } from "./presentation/controllers/user/user.controller";
import { pluginGracefulServer } from "graceful-server-elysia";
import { responseHandler } from "./presentation/middleware/error-handler.middleware";
import { securityConfig } from "./presentation/middleware/security.middleware";

const app = new Elysia()
  .use(pluginGracefulServer({}))
  .use(securityConfig)
  .use(responseHandler)
  .use(AuthController)
  .use(RoleController)
  .use(UserController);

app.listen(process.env.PORT ?? 3000);

export type App = typeof app;
