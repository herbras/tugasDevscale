import type { CustomError } from "../../interfaces/errors";
import type { ILogger } from "../../interfaces/ILogger";
import { injectable } from "inversify";
import { loggerConfig } from "../../utils/pino";
import { pino } from "pino";

@injectable()
export class LoggerServiceDev implements ILogger {
  private readonly logger: pino.Logger;

  constructor() {
    const config = {
      ...loggerConfig.development,
      serializers: {
        error: (error: CustomError) => {
          const { message, stack, status, details, metadata, ...rest } = error;
          return {
            status,
            details,
            metadata,
            stack,
            message,
            ...rest,
          };
        },
      },
    };
    this.logger = pino(config);
  }

  private formatLogMessage(
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    if (metadata && "error" in metadata) {
      const {
        message: errorMessage,
        stack,
        status,
        details,
      } = metadata.error as CustomError;
      return {
        msg: message,
        error: {
          status,
          details,
          stack,
          message: errorMessage,
        },
        metadata,
      };
    }
    return {
      msg: message,
      ...(metadata ? { context: metadata } : {}),
    };
  }
  info(message: string, metadata?: Record<string, unknown>): void {
    this.logger.info(this.formatLogMessage(message, metadata));
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.logger.error(this.formatLogMessage(message, metadata));
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.logger.warn(this.formatLogMessage(message, metadata));
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.logger.debug(this.formatLogMessage(message, metadata));
  }
}
