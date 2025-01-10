import type {
  StandardResponseMeta,
  ValidationErrorDetail,
} from "./response.types.js";

import { StatusMap } from "elysia";

export interface CustomError extends Error {
  status?: number;
  details?: ValidationErrorDetail[];
  metadata?: StandardResponseMeta;
}

export class AppError extends Error {
  public status: number;
  public details?: ValidationErrorDetail[];
  public metadata?: StandardResponseMeta;

  constructor(
    message: string,
    status: number = StatusMap["Internal Server Error"],
    details?: ValidationErrorDetail[],
    metadata?: StandardResponseMeta,
  ) {
    super(message);
    this.status = status;
    this.details = details;
    this.metadata = metadata;
  }
}

// Common error classes using Elysia's StatusMap
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, StatusMap.Unauthorized);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation Error", details?: ValidationErrorDetail[]) {
    super(message, StatusMap["Unprocessable Content"], details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not Found") {
    super(message, StatusMap["Not Found"]);
  }
}
