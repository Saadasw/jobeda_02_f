import axios from 'axios';

export interface FieldError {
  /** The offending field name (last segment of FastAPI's `loc`). */
  field: string;
  message: string;
}

export interface NormalizedError {
  status: number | null;
  /** A human-friendly top-level message (toast/banner). */
  message: string;
  /** Per-field errors from a FastAPI 422 validation response. */
  fieldErrors: FieldError[];
}

interface PydanticDetailItem {
  loc?: (string | number)[];
  msg?: string;
}

/**
 * Normalize the two error shapes the backend returns:
 *  - 422 → `{ detail: [{ loc, msg }, ...] }`  (Pydantic field errors)
 *  - 4xx → `{ detail: "message" }`            (business/HTTPException errors)
 * plus network/unknown errors.
 */
export function normalizeError(err: unknown): NormalizedError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? null;
    const detail = (err.response?.data as { detail?: unknown } | undefined)?.detail;

    if (Array.isArray(detail)) {
      const fieldErrors: FieldError[] = (detail as PydanticDetailItem[]).map((d) => ({
        field:
          Array.isArray(d.loc) && d.loc.length > 0 ? String(d.loc[d.loc.length - 1]) : 'form',
        message: d.msg ?? 'Invalid value',
      }));
      return {
        status,
        message: fieldErrors[0]?.message ?? 'Please fix the highlighted fields.',
        fieldErrors,
      };
    }

    if (typeof detail === 'string') {
      return { status, message: detail, fieldErrors: [] };
    }

    if (status === null) {
      return {
        status,
        message: 'Network error — please check your connection.',
        fieldErrors: [],
      };
    }

    return { status, message: `Request failed (${status}).`, fieldErrors: [] };
  }

  return { status: null, message: 'Something went wrong.', fieldErrors: [] };
}
