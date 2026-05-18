import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireAdminPanel } from "../middleware/requireAdmin.middleware.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { adminUsersRouter } from "../modules/users/adminUsers.routes.js";
import { managementRouter } from "./management.router.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);

apiRouter.use(authMiddleware);
apiRouter.use(requireAdminPanel);

apiRouter.use("/users", adminUsersRouter);
apiRouter.use(managementRouter);
