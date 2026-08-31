export class DomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "The requested resource is not available") {
    super("FORBIDDEN", message);
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "The requested resource was not found") {
    super("NOT_FOUND", message);
  }
}

export class ConflictError extends DomainError {
  constructor(message = "The requested change conflicts with current state") {
    super("CONFLICT", message);
  }
}

export class IdempotencyConflictError extends ConflictError {
  constructor(message = "The idempotency key was used for another operation") {
    super(message);
    this.name = "IdempotencyConflictError";
  }
}

export class ClosedSessionError extends ConflictError {
  constructor(message = "Closed sessions are read-only") {
    super(message);
    this.name = "ClosedSessionError";
  }
}
