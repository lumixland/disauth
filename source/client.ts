import { request } from "undici";
import type { Dispatcher } from "undici";
import {
  DISCORD_OAUTH_SCOPES,
  DiscordConnection,
  DiscordPartialGuild,
  DiscordPrompt,
  DiscordScope,
  DiscordUser,
  OAuthAuthorizeOptions,
  OAuthConfig,
  OAuthErrorPayload,
  RevokeTokenOptions,
  TokenResponse,
} from "./types.js";
import {
  DISCORD_API,
  DISCORD_OAUTH_AUTHORIZE,
  DISCORD_TOKEN_REVOKE_URL,
  DISCORD_TOKEN_URL,
} from "./constants.js";
import { DiscordHttpError, DiscordOAuthError } from "./errors.js";

type HeaderRecord = Record<string, string>;
type RequestOptions = Partial<
  Omit<Dispatcher.RequestOptions, "headers" | "origin" | "path">
> & {
  headers?: HeaderRecord;
};

const DEFAULT_SCOPES: DiscordScope[] = ["identify"];

export class Client {
  private readonly apiBaseUrl: string;
  private readonly oauthAuthorizeUrl: string;
  private readonly tokenUrl: string;
  private readonly revokeUrl: string;
  private readonly userAgent: string;
  private readonly defaultPrompt: DiscordPrompt;
  private readonly requestTimeoutMs?: number;
  private readonly scopes: DiscordScope[];

  constructor(private config: OAuthConfig) {
    this.scopes = this.normalizeScopes(config.scopes);
    const oauthBase = this.getOauthBase(config.oauthBaseUrl);
    const trimmedApiBase = (config.apiBaseUrl ?? DISCORD_API).replace(/\/$/, "");

    this.apiBaseUrl = trimmedApiBase;
    this.oauthAuthorizeUrl = `${oauthBase}/oauth2/authorize`;
    this.tokenUrl =
      trimmedApiBase === DISCORD_API
        ? DISCORD_TOKEN_URL
        : `${trimmedApiBase}/oauth2/token`;
    this.revokeUrl =
      trimmedApiBase === DISCORD_API
        ? DISCORD_TOKEN_REVOKE_URL
        : `${trimmedApiBase}/oauth2/token/revoke`;
    this.userAgent =
      config.userAgent ?? "dauth (https://www.npmjs.com/package/dauth)";
    this.defaultPrompt = config.defaultPrompt ?? "consent";
    this.requestTimeoutMs = config.requestTimeoutMs;
  }

  /**
   * Generate an authorization URL for the configured application.
   */
  generateAuthUrl(state?: string, prompt?: DiscordPrompt): string;
  /**
   * Generate an authorization URL with advanced options.
   */
  generateAuthUrl(options: OAuthAuthorizeOptions): string;
  generateAuthUrl(
    stateOrOptions?: string | OAuthAuthorizeOptions,
    prompt: DiscordPrompt = this.defaultPrompt,
  ): string {
    const baseOptions =
      typeof stateOrOptions === "string" || !stateOrOptions
        ? { state: stateOrOptions as string | undefined, prompt }
        : stateOrOptions;

    const resolvedPrompt = baseOptions.prompt ?? prompt ?? this.defaultPrompt;
    const resolvedRedirectUri =
      baseOptions.redirectUri ?? this.config.redirectUri;
    const resolvedScopes = baseOptions.scopes
      ? this.normalizeScopes(baseOptions.scopes)
      : this.scopes;

    const params = new URLSearchParams({
      response_type: baseOptions.responseType ?? "code",
      client_id: this.config.clientId,
      scope: resolvedScopes.join(" "),
      redirect_uri: resolvedRedirectUri,
      prompt: resolvedPrompt,
    });

    if (baseOptions.state) params.set("state", baseOptions.state);

    if (baseOptions.codeChallenge) {
      params.set("code_challenge", baseOptions.codeChallenge);
      params.set(
        "code_challenge_method",
        baseOptions.codeChallengeMethod ?? "S256",
      );
    }

    if (baseOptions.permissions !== undefined)
      params.set("permissions", String(baseOptions.permissions));

    if (baseOptions.disableGuildSelect !== undefined)
      params.set(
        "disable_guild_select",
        baseOptions.disableGuildSelect ? "true" : "false",
      );

    if (baseOptions.guildId) params.set("guild_id", baseOptions.guildId);
    if (baseOptions.loginHint) params.set("login_hint", baseOptions.loginHint);

    return `${this.oauthAuthorizeUrl}?${params.toString()}`;
  }

  /**
   * Exchange an authorization code for tokens. Pass a PKCE code verifier when used with PKCE.
   */
  async exchangeCode(code: string, codeVerifier?: string): Promise<TokenResponse> {
    const data = new URLSearchParams({
      client_id: this.config.clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: this.config.redirectUri,
    });

    if (this.config.clientSecret)
      data.set("client_secret", this.config.clientSecret);
    if (codeVerifier) data.set("code_verifier", codeVerifier);

    return this.fetchToken(data);
  }

  /**
   * Exchange client credentials for an application access token.
   */
  async exchangeClientCredentials(scopes?: DiscordScope[]): Promise<TokenResponse> {
    const clientSecret = this.requireClientSecret("Client credentials flow");
    const resolvedScopes = scopes ? this.normalizeScopes(scopes) : this.scopes;

    const data = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: resolvedScopes.join(" "),
    });

    return this.fetchToken(data);
  }

  /**
   * Fetch the authenticated user's profile.
   */
  async getUser(accessToken: string): Promise<DiscordUser> {
    return this.api<DiscordUser>("/users/@me", accessToken);
  }

  /**
   * Fetch guild membership information for the authenticated user.
   */
  async getGuilds(accessToken: string): Promise<DiscordPartialGuild[]> {
    return this.api<DiscordPartialGuild[]>("/users/@me/guilds", accessToken);
  }

  /**
   * Fetch linked connections for the authenticated user.
   */
  async getConnections(accessToken: string): Promise<DiscordConnection[]> {
    return this.api<DiscordConnection[]>("/users/@me/connections", accessToken);
  }

  /**
   * Refresh an access token using a refresh token.
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const data = new URLSearchParams({
      client_id: this.config.clientId,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    if (this.config.clientSecret)
      data.set("client_secret", this.config.clientSecret);

    return this.fetchToken(data);
  }

  /**
   * Revoke an access or refresh token.
   */
  async revokeToken(token: string, options: RevokeTokenOptions = {}): Promise<void> {
    const clientSecret = this.requireClientSecret("Token revocation");
    const data = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: clientSecret,
      token,
    });

    if (options.tokenTypeHint)
      data.set("token_type_hint", options.tokenTypeHint);

    await this.execute<void>(
      this.revokeUrl,
      {
        method: "POST",
        body: data.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
      { expectJson: false, treatAsOAuth: true },
    );
  }

  /**
   * Execute a generic REST request against the Discord API.
   */
  async api<T>(path: string, accessToken: string, init: RequestOptions = {}): Promise<T> {
    const url = this.resolveApiUrl(path);

    return this.execute<T>(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init.headers ?? {}),
      },
    });
  }

  private async fetchToken(data: URLSearchParams): Promise<TokenResponse> {
    return this.execute<TokenResponse>(
      this.tokenUrl,
      {
        method: "POST",
        body: data.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
      { treatAsOAuth: true },
    );
  }

  private async execute<T>(
    url: string,
    options: RequestOptions,
    behaviour: { expectJson?: boolean; treatAsOAuth?: boolean } = {},
  ): Promise<T> {
    const { expectJson = true, treatAsOAuth = false } = behaviour;
    const normalized = this.applyDefaults(url, options);
    const response = await request(normalized.origin!, normalized);
    const raw = await response.body.text();
    const parsed = raw && expectJson ? this.safeParse(raw) : undefined;

    if (response.statusCode >= 400) {
      const method = normalized.method ?? "GET";

      if (treatAsOAuth) {
        const payload: OAuthErrorPayload =
          (parsed as OAuthErrorPayload | undefined) ?? {
            error: "unknown_error",
            error_description: raw || undefined,
          };

        throw new DiscordOAuthError(response.statusCode, url, method, payload);
      }

      throw new DiscordHttpError(
        response.statusCode,
        url,
        method,
        parsed ?? (raw ? { message: raw } : undefined),
      );
    }

    if (!expectJson) return undefined as T;
    if (!raw) return undefined as T;

    return (parsed ?? (raw as unknown)) as T;
  }

  private applyDefaults(
    url: string,
    options: RequestOptions,
  ): Dispatcher.RequestOptions {
    const parsed = new URL(url);
    const origin = `${parsed.protocol}//${parsed.host}`;
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;

    const normalized: Dispatcher.RequestOptions = {
      ...options,
      origin,
      path,
      method: options.method ?? "GET",
      headers: this.mergeHeaders(options.headers),
    };

    if (this.requestTimeoutMs !== undefined) {
      normalized.bodyTimeout ??= this.requestTimeoutMs;
      normalized.headersTimeout ??= this.requestTimeoutMs;
    }

    return normalized;
  }

  private mergeHeaders(headers?: HeaderRecord): HeaderRecord {
    return {
      "User-Agent": this.userAgent,
      ...headers,
    };
  }

  private resolveApiUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;

    const normalized = path.startsWith("/") ? path : `/${path}`;

    return `${this.apiBaseUrl}${normalized}`;
  }

  private safeParse(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  private normalizeScopes(scopes?: DiscordScope[]): DiscordScope[] {
    const candidate = scopes?.length ? scopes : DEFAULT_SCOPES;
    const invalid = candidate.filter(
      (scope) => !DISCORD_OAUTH_SCOPES.includes(scope),
    );

    if (invalid.length)
      throw new Error(
        `Invalid Discord OAuth scope(s): ${invalid.join(", ")}`,
      );

    return [...new Set(candidate)];
  }

  private getOauthBase(oauthBaseUrl?: string): string {
    const base = oauthBaseUrl ?? new URL(DISCORD_OAUTH_AUTHORIZE).origin;

    return base.replace(/\/$/, "");
  }

  private requireClientSecret(operation: string): string {
    if (!this.config.clientSecret)
      throw new Error(`${operation} requires a client secret.`);

    return this.config.clientSecret;
  }
}
