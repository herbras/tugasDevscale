import { Elysia, InvertedStatusMap } from "elysia";

import { AppError } from "../../interfaces/errors";
import { logger } from "../../infrasturture/ioc/container";

export const responseHandler = new Elysia()
  .onAfterHandle({ as: "global" }, ({ response, path, set }) => {
    const status = set.status ?? 200;
    const type =
      InvertedStatusMap[status as keyof typeof InvertedStatusMap] || "OK";

    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        type,
        path,
        version: "1.0",
        status,
        data: response,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  })
  .onError({ as: "global" }, ({ code, error, path, set }) => {
    logger.error("Application error:", { code, error });

    const status =
      error instanceof AppError
        ? error.status
        : (() => {
            switch (code) {
              case "NOT_FOUND":
                return 404;
              case "VALIDATION":
                return 422;
              case "PARSE":
                return 400;
              default:
                return 500;
            }
          })();

    let type = "Internal Server Error";
    if (status in InvertedStatusMap) {
      type = InvertedStatusMap[status as keyof typeof InvertedStatusMap];
    }

    set.status = status;

    if (code === "VALIDATION") {
      try {
        const validationError = JSON.parse(error.message);
        return Response.json({
          timestamp: new Date().toISOString(),
          status,
          type,
          path,
          version: "1.0",
          message: validationError.summary || "Validation failed",
          details: {
            field: validationError.property?.slice(1),
            error: validationError.message,
          },
        });
      } catch {
        return Response.json({
          timestamp: new Date().toISOString(),
          status,
          type,
          path,
          version: "1.0",
          message: "Validation failed",
          details: { error: error.message },
        });
      }
    }

    const appError =
      error instanceof AppError
        ? error
        : new AppError(error.message || "Internal Server Error", status);

    return Response.json({
      timestamp: new Date().toISOString(),
      status,
      type,
      path,
      version: "1.0",
      message: appError.message,
      details: appError.details,
      metadata: appError.metadata,
    });
  });
