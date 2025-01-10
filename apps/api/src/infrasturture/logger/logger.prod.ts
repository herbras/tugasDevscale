import type { BunFile } from "bun";
import type { ILogger } from "../../interfaces/ILogger";
import { injectable } from "inversify";
import { loggerConfig } from "../../utils/pino";
import { mkdir } from "node:fs/promises";
import { pino } from "pino";

@injectable()
export class LoggerServiceProd implements ILogger {
  private logger: pino.Logger;
  private readonly env: string;
  private readonly logsDir: string;
  private errorFile: BunFile | null = null;
  private combinedFile: BunFile | null = null;
  private isInitialized = false;

  constructor() {
    this.env = process.env.NODE_ENV ?? "production";
    this.logsDir = `${process.cwd()}/logs`;

    // Create a no-op logger initially
    this.logger = pino({
      enabled: false,
      level: "silent",
    });
  }

  private async initializeLogsDirectory(): Promise<void> {
    await mkdir(this.logsDir, { recursive: true });
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.initializeLogsDirectory();

    // Create log files after directory is created
    this.errorFile = Bun.file(`${this.logsDir}/error.log`);
    this.combinedFile = Bun.file(`${this.logsDir}/combined.log`);

    this.logger = this.initializeLogger();
    this.isInitialized = true;
  }

  private initializeLogger(): pino.Logger {
    if (!this.errorFile || !this.combinedFile) {
      throw new Error("Logger files not initialized. Call initialize() first.");
    }

    const config = loggerConfig[this.env as keyof typeof loggerConfig];

    const errorStream = {
      write: (msg: string) => {
        if (this.errorFile) {
          Bun.write(this.errorFile, msg);
        }
      },
    };

    const combinedStream = {
      write: (msg: string) => {
        if (this.combinedFile) {
          Bun.write(this.combinedFile, msg);
        }
      },
    };

    return pino(
      config,
      pino.multistream([
        { level: "error", stream: errorStream },
        { level: "info", stream: combinedStream },
      ]),
    );
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error("Logger not initialized. Call initialize() first.");
    }
  }

  private formatLogMessage(message: string, metadata?: object): object {
    return {
      msg: message,
      timestamp: new Date().toISOString(),
      ...(metadata ? { context: metadata } : {}),
    };
  }

  info(message: string, metadata?: object): void {
    this.ensureInitialized();
    this.logger.info(this.formatLogMessage(message, metadata));
  }

  error(message: string, metadata?: object): void {
    this.ensureInitialized();
    this.logger.error(this.formatLogMessage(message, metadata));
  }

  warn(message: string, metadata?: object): void {
    this.ensureInitialized();
    this.logger.warn(this.formatLogMessage(message, metadata));
  }

  debug(message: string, metadata?: object): void {
    this.ensureInitialized();
    this.logger.debug(this.formatLogMessage(message, metadata));
  }
}
