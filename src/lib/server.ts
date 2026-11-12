export async function readRequestBody(request: Request, maximumBytes = 16000) {
  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);
  const host = request.headers.get("host") || requestUrl.host;
  if (
    origin &&
    (new URL(origin).host !== host ||
      new URL(origin).protocol !== requestUrl.protocol)
  )
    throw new Error("Cross-origin request rejected.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing request body.");
  let length = 0;
  let body = "";
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximumBytes) {
        await reader.cancel();
        throw new Error("Request is too large.");
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return JSON.parse(body) as unknown;
  } finally {
    reader.releaseLock();
  }
}

const windows = new Map<string, { started: number; count: number }>();

export function allowRequest(scope: string, maximum = 30) {
  const now = Date.now();
  const current = windows.get(scope);
  if (!current || now - current.started > 60000) {
    windows.set(scope, { started: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= maximum;
}
