import { translations } from "../../translations";
import type { Language } from "../../types";

interface ParsedApiError {
  statusCode?: number;
  message: string;
}

function parseErrorPayload(rawText: string): ParsedApiError {
  let statusCode: number | undefined;
  let message = rawText;

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        statusCode?: number | string;
        status?: number | string;
        message?: string | string[];
        error?: string;
      };

      const rawStatus = parsed.statusCode ?? parsed.status;
      if (rawStatus !== undefined) {
        const numericStatus = Number(rawStatus);
        if (!Number.isNaN(numericStatus)) {
          statusCode = numericStatus;
        }
      }

      if (Array.isArray(parsed.message)) {
        message = parsed.message.join(", ");
      } else if (typeof parsed.message === "string" && parsed.message.trim()) {
        message = parsed.message;
      } else if (typeof parsed.error === "string" && parsed.error.trim()) {
        message = parsed.error;
      }
    } catch {}
  }

  return { statusCode, message };
}

export function formatChatError(
  err: unknown,
  lang: Language = "en",
  fallbackMessage?: string,
): string {
  const tChat = (translations[lang] ?? translations.en).chat;
  const errorStrings = tChat.errors;
  const fallback = fallbackMessage?.trim() || errorStrings.generic;

  const rawText =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : err && typeof err === "object"
          ? JSON.stringify(err)
          : "";

  const { statusCode, message } = parseErrorPayload(rawText);
  const normalized = message.toLowerCase();

  if (
    statusCode === 413 ||
    normalized.includes("413") ||
    normalized.includes("request entity too large") ||
    normalized.includes("payload too large") ||
    normalized.includes("message too long") ||
    normalized.includes("content too large")
  ) {
    return errorStrings.tooLong;
  }

  if (
    statusCode === 401 ||
    normalized.includes("401") ||
    normalized.includes("unauthorized") ||
    normalized.includes("authentication token") ||
    normalized.includes("token is missing") ||
    normalized.includes("jwt expired") ||
    normalized.includes("invalid token")
  ) {
    return errorStrings.unauthorized;
  }

  if (
    statusCode === 403 ||
    normalized.includes("403") ||
    normalized.includes("forbidden") ||
    normalized.includes("not allowed")
  ) {
    return errorStrings.forbidden;
  }

  if (
    statusCode === 404 ||
    normalized.includes("404") ||
    normalized.includes("not found")
  ) {
    return errorStrings.notFound;
  }

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("err_network") ||
    (statusCode !== undefined && statusCode >= 500)
  ) {
    return errorStrings.network;
  }

  const trimmed = rawText.trim();
  const looksLikeRawJson =
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));

  if (looksLikeRawJson || /"statuscode"\s*:/i.test(trimmed)) {
    return fallback;
  }

  return message.trim() || fallback;
}
