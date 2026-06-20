import { clearStoredSession, getStoredSession } from "../utils/sessionStorage";

const DEFAULT_API_URL = import.meta.env.PROD ? "/api" : "http://localhost:3000/api";
const DIRECT_BACKEND_ORIGIN = "https://logickids-backend-sena.onrender.com";
const RENDER_API_URL = `${DIRECT_BACKEND_ORIGIN}/api`;

const normalizeBaseUrl = (value) =>
  typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";

const isAbsoluteHttpUrl = (value) => /^https?:\/\//i.test(value);

const resolveBaseUrl = () => {
  const configuredUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL || DEFAULT_API_URL);

  if (import.meta.env.PROD && configuredUrl === RENDER_API_URL) {
    return "/api";
  }

  return configuredUrl;
};

const API_BASE_URL = resolveBaseUrl();

class HttpError extends Error {
  constructor(message, status, details = [], meta = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
    this.meta = meta;
  }
}

const formatErrorDetails = (details = []) => {
  if (!Array.isArray(details) || details.length === 0) {
    return "";
  }

  return details
    .map((detail) => detail?.message)
    .filter(Boolean)
    .join(" ");
};

const buildHeaders = (body, auth) => {
  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const session = getStoredSession();

    if (session?.token) {
      headers.Authorization = `Bearer ${session.token}`;
    }
  }

  return headers;
};

const parsePayload = async (response) => {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
};

const emitSessionExpired = () => {
  clearStoredSession();
  window.dispatchEvent(new Event("lk:session-expired"));
};

export const request = async (path, { method = "GET", body, auth = true } = {}) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: buildHeaders(body, auth),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new HttpError(
      "No fue posible conectar con el backend. Revisa que el servidor esté encendido.",
      0
    );
  }

  const payload = await parsePayload(response);

  if (!response.ok) {
    if (response.status === 401 && auth) {
      emitSessionExpired();
    }

    const details = payload?.errors || [];
    const detailMessage = formatErrorDetails(details);
    const baseMessage = payload?.message || "No fue posible completar la solicitud.";
    const { success, message, errors, data, ...meta } = payload ?? {};

    throw new HttpError(
      detailMessage ? `${baseMessage}: ${detailMessage}` : baseMessage,
      response.status,
      details,
      meta
    );
  }

  return payload;
};

export const resolveApiBaseUrl = () => API_BASE_URL;

/**
 * En Vercel el frontend puede hablar con REST via rewrite `/api`, pero los
 * sockets deben apuntar al backend real porque Vercel no hospeda nuestro
 * servidor Socket.IO. Por eso resolvemos una base separada para realtime.
 */
export const resolveSocketBaseUrl = () => {
  const configuredSocketUrl = normalizeBaseUrl(import.meta.env.VITE_SOCKET_URL);
  if (configuredSocketUrl) {
    return configuredSocketUrl;
  }

  const configuredApiUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL);
  if (import.meta.env.PROD && isAbsoluteHttpUrl(configuredApiUrl)) {
    return configuredApiUrl.replace(/\/api\/?$/, "");
  }

  if (import.meta.env.PROD && API_BASE_URL === "/api") {
    return DIRECT_BACKEND_ORIGIN;
  }

  return API_BASE_URL.replace(/\/api\/?$/, "");
};

export { HttpError };
