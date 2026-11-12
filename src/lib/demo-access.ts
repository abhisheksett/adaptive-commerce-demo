export async function requireDemoAccess(request: Request) {
  const password = process.env.DEMO_PASSWORD;
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NETLIFY !== "true" &&
    !password
  )
    return null;

  const headers = {
    "Cache-Control": "private, no-store",
    Vary: "Authorization",
    "X-Content-Type-Options": "nosniff",
  };
  if (!password || password.length < 8)
    return Response.json(
      { error: "Private demo access is not configured." },
      { status: 503, headers },
    );

  const authorization = request.headers.get("authorization") ?? "";
  if (authorization.length <= 512 && /^Basic /i.test(authorization)) {
    try {
      const decoded = new TextDecoder("utf-8", { fatal: true }).decode(
        Uint8Array.from(atob(authorization.slice(6)), (character) =>
          character.charCodeAt(0),
        ),
      );
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"],
      );
      const expected = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(`${process.env.DEMO_USERNAME || "demo"}:${password}`),
      );
      if (
        await crypto.subtle.verify(
          "HMAC",
          key,
          expected,
          encoder.encode(decoded),
        )
      )
        return null;
    } catch {}
  }
  return Response.json(
    { error: "Private demo access required." },
    {
      status: 401,
      headers: {
        ...headers,
        "WWW-Authenticate": 'Basic realm="LIFE private demo", charset="UTF-8"',
      },
    },
  );
}
