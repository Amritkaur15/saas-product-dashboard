export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super(message, 400);
    this.name = "ValidationError";
  }
}

export interface ErrorResponse {
  status: number;
  body: { error: string };
}

// Route handlers call this in their catch blocks so status codes and
// error messages are mapped in exactly one place, never per-route.
export function handleError(error: unknown): ErrorResponse {
  if (error instanceof AppError) {
    return { status: error.statusCode, body: { error: error.message } };
  }

  return { status: 500, body: { error: "Internal server error" } };
}
