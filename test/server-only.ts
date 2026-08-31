// Vitest runs server-module tests outside the Next compiler. Next's real
// `server-only` package remains active in application builds; this empty test
// seam only prevents its intentional client-boundary throw during unit tests.
export {};
