import type { OAuthErrorPayload } from "./types.js";

export class DiscordHttpError<T = unknown> extends Error {
  /**
   * Error thrown when Discord responds with an HTTP error status.
   */
  constructor(
    public readonly statusCode: number,
    public readonly url: string,
    public readonly method: string,
    public readonly details?: T,
  ) {
    super(`${method} ${url} failed with status ${statusCode}`);
    this.name = "DiscordHttpError";
  }
}

export class DiscordOAuthError extends DiscordHttpError<OAuthErrorPayload> {
  /**
   * Error thrown when the OAuth endpoints return an error payload.
   */
  constructor(
    statusCode: number,
    url: string,
    method: string,
    details: OAuthErrorPayload,
  ) {
    super(statusCode, url, method, details);
    this.name = "DiscordOAuthError";
  }

  /** Raw OAuth error code. */
  get error(): string | undefined {
    return this.details?.error;
  }

  /** Human-readable error description, when present. */
  get description(): string | undefined {
    return this.details?.error_description;
  }
}
