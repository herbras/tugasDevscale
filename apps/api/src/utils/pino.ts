import type { LoggerOptions } from "pino";

interface LoggerConfig {
  development: LoggerOptions;
  production: LoggerOptions;
  test: LoggerOptions;
}

const formatStack = (stack: string | undefined) => {
  return stack ? stack.split("\n").map((line) => line.trim()) : undefined;
};

interface ExtendedError extends Error {
  [key: string]: unknown;
}

const commonSerializers = {
  err: (err: unknown) => {
    if (err instanceof Error) {
      const errorObj = err as ExtendedError;
      return {
        type: errorObj.constructor.name,
        message: errorObj.message,
        stack: formatStack(errorObj.stack),
        ...Object.fromEntries(
          Object.entries(errorObj).filter(
            ([key]) => !["name", "message", "stack"].includes(key),
          ),
        ),
      };
    }
    return err;
  },
  error: (err: unknown) => {
    if (err instanceof Error) {
      const errorObj = err as ExtendedError;
      return {
        type: errorObj.constructor.name,
        message: errorObj.message,
        stack: formatStack(errorObj.stack),
        ...Object.fromEntries(
          Object.entries(errorObj).filter(
            ([key]) => !["name", "message", "stack"].includes(key),
          ),
        ),
      };
    }
    return err;
  },
};

export const loggerConfig: LoggerConfig = {
  development: {
    level: "debug",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        levelFirst: true,
        translateTime: "yyyy-mm-dd HH:MM:ss",
      },
    },
    serializers: commonSerializers,
  },
  production: {
    level: "info",
    serializers: commonSerializers,
  },
  test: {
    level: "error",
    enabled: false,
    serializers: commonSerializers,
  },
};
