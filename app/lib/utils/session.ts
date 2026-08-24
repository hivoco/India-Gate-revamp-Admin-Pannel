// reads the expiry out of the access token so the panel can log out on its
// own schedule instead of waiting for an api call to come back 401.
//
// this only decodes, it does not verify. the signature is checked on the
// server on every request, what we need here is just "when does this stop
// being useful", which is a ui concern.

interface JwtClaims {
  exp?: number;
}

/** Expiry as a unix ms timestamp, or null if the token carries no exp. */
export function getTokenExpiry(token: string | null): number | null {
  if (!token) return null;

  const payload = token.split(".")[1];

  if (!payload) return null;

  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as JwtClaims;

    return typeof claims.exp === "number" ? claims.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Whether the token is past its expiry.
 *
 * A token with no exp claim is treated as still good, the server is the one
 * that decides, and guessing "expired" here would lock someone out of a panel
 * the api would happily serve.
 */
export function isTokenExpired(token: string | null): boolean {
  const expiry = getTokenExpiry(token);

  if (expiry === null) return false;

  return Date.now() >= expiry;
}
