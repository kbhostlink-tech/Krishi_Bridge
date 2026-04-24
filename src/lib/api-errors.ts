type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function extractMessage(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = extractMessage(item);
      if (message) {
        return message;
      }
    }
  }

  return undefined;
}

export function getApiFieldErrors(payload: unknown): Record<string, string> {
  const record = asRecord(payload);
  const details = asRecord(record?.details);
  const source = asRecord(details?.fieldErrors) ?? details;

  if (!source) {
    return {};
  }

  const fieldErrors: Record<string, string> = {};

  for (const [field, value] of Object.entries(source)) {
    const message = extractMessage(value);
    if (message) {
      fieldErrors[field] = message;
    }
  }

  return fieldErrors;
}

export function getApiFormErrors(payload: unknown): string[] {
  const record = asRecord(payload);
  const details = asRecord(record?.details);
  const rawFormErrors = details?.formErrors;

  if (!Array.isArray(rawFormErrors)) {
    return [];
  }

  return rawFormErrors
    .map((item) => extractMessage(item))
    .filter((message): message is string => Boolean(message));
}

export function getApiErrorMessage(payload: unknown, fallback = "Something went wrong"): string {
  const record = asRecord(payload);
  const explicitError = typeof record?.error === "string" ? record.error.trim() : "";
  const formError = getApiFormErrors(payload)[0];
  const fieldError = Object.values(getApiFieldErrors(payload))[0];

  if (explicitError && explicitError !== "Validation failed") {
    return explicitError;
  }

  return formError || fieldError || explicitError || fallback;
}
