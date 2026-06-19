import { clearStoredSession, getStoredSession } from "../utils/sessionStorage";

const DEFAULT_API_URL = import.meta.env.PROD ? "/api" : "http://localhost:3000/api";
const RENDER_API_URL = "https://logickids-backend-sena.onrender.com/api";

const resolveBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

  if (import.meta.env.PROD && configuredUrl.replace(/\/+$/, "") === RENDER_API_URL) {
    return "/api";
  }

  return configuredUrl.replace(/\/+$/, "");
};

const API_BASE_URL = resolveBaseUrl();

class HttpError extends Error {
  constructor(message, status, details = []) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
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

    throw new HttpError(
      detailMessage ? `${baseMessage}: ${detailMessage}` : baseMessage,
      response.status,
      details
    );
  }

  return payload;
};

export const resolveApiBaseUrl = () => API_BASE_URL;

export { HttpError };
