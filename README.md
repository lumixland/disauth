# dauth

Modern Discord OAuth made simple. `dauth` wraps the Discord OAuth2 and REST APIs with safe defaults, PKCE helpers, and rich typings so you can add login flows to bots, dashboards, and tooling faster.

## Features
- OAuth2 Authorization Code, PKCE, Refresh, and Client Credentials flows
- Helpers for fetching `/users/@me`, guilds, and linked connections
- Configurable base URLs for Discord API proxies
- Token revocation support and typed error classes
- Tiny surface area: one configurable `Client`, plus utilities like `generatePkcePair`

## Installation

```bash
pnpm add dauth
# or
npm install dauth
# or
yarn add dauth
# or
bun add dauth
```

## Quick Start

```ts
import { Client } from "dauth";

const client = new Client({
	clientId: process.env.DISCORD_CLIENT_ID!,
	clientSecret: process.env.DISCORD_CLIENT_SECRET!,
	redirectUri: "https://your-app.dev/oauth/callback",
	scopes: ["identify", "email"],
});

// 1. Redirect users to Discord
const authUrl = client.generateAuthUrl("state-token");

// 2. Exchange the authorization code in your OAuth callback handler
const { access_token, refresh_token } = await client.exchangeCode(code);

// 3. Call Discord APIs on behalf of the user
const user = await client.getUser(access_token);
```

## Using PKCE

PKCE is pre-baked: generate a verifier/challenge pair on the client, send the challenge with the authorization URL, and later pass the verifier when exchanging the code.

```ts
import { Client, generatePkcePair } from "dauth";

const pkce = generatePkcePair();

const authUrl = client.generateAuthUrl({
	state: "csrf-token",
	codeChallenge: pkce.challenge,
	codeChallengeMethod: pkce.method,
});

// Later in the callback route
const tokens = await client.exchangeCode(code, pkce.verifier);
```

## Client Credentials Flow

```ts
const tokens = await client.exchangeClientCredentials(["applications.commands"]);
```

## Generic REST Helper

```ts
const guilds = await client.api("/users/@me/guilds", access_token);
```

Pass a full URL to hit custom endpoints or proxies. Headers and request options can be overridden via the third parameter.

## Token Revocation

```ts
await client.revokeToken(refresh_token, { tokenTypeHint: "refresh_token" });
```

## Error Handling

Errors thrown by the client extend `DiscordHttpError`. OAuth-specific issues raise `DiscordOAuthError` with the raw payload attached.

```ts
import { DiscordOAuthError } from "dauth";

try {
	await client.exchangeCode(code);
} catch (error) {
	if (error instanceof DiscordOAuthError) {
		console.error(error.error, error.description);
	}
}
```

## Types and Constants

The package exports the complete list of scopes (`DISCORD_OAUTH_SCOPES`), prompt types, connection and guild interfaces, and Discord endpoints for convenience.
