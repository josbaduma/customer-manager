const AUTH_SECRET = process.env.AUTH_SECRET || "change_this_secret_in_production";
const TOKEN_LIFETIME = 1000 * 60 * 60 * 24 * 7; // 7 días

type AuthPayload = {
  userId: number;
  iat: number;
  exp: number;
};

function base64UrlEncode(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  const base64 = typeof btoa === "function" ? btoa(binary) : "";
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }

  const binary = typeof atob === "function" ? atob(base64) : "";
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function encode(value: object) {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

function decode<T>(value: string) {
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(value))) as T;
}

function constantTimeCompare(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}

async function sign(value: string) {
  const keyData = new TextEncoder().encode(AUTH_SECRET);
  const messageData = new TextEncoder().encode(value);
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    throw new Error("Web Crypto is not available in this runtime");
  }

  const key = await subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await subtle.sign("HMAC", key, messageData);
  return base64UrlEncode(new Uint8Array(signature));
}

export async function createAuthToken(userId: number) {
  const payload: AuthPayload = {
    userId,
    iat: Date.now(),
    exp: Date.now() + TOKEN_LIFETIME,
  };

  const encoded = encode(payload);
  const signature = await sign(encoded);

  return `${encoded}.${signature}`;
}

export async function verifyAuthToken(token: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return false;
  }

  const expectedSignature = await sign(encoded);
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  const signatureBytes = base64UrlDecode(signature);
  const expectedBytes = base64UrlDecode(expectedSignature);
  if (!constantTimeCompare(signatureBytes, expectedBytes)) {
    return false;
  }

  try {
    const payload = decode<AuthPayload>(encoded);
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}
