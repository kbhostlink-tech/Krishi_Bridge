function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toLocalDateTimeInputValue(value: string | Date | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getCurrentLocalDateTimeInputValue(offsetMinutes = 0): string {
  return toLocalDateTimeInputValue(new Date(Date.now() + offsetMinutes * 60_000));
}

export function getDateInputValue(dateTimeValue: string): string {
  return dateTimeValue.slice(0, 10);
}

export function getTimeInputValue(dateTimeValue: string, fallback = ""): string {
  return dateTimeValue.slice(11, 16) || fallback;
}

export function mergeDateAndTime(dateValue: string, timeValue: string, fallbackTime = "00:00"): string {
  if (!dateValue) {
    return "";
  }

  return `${dateValue}T${timeValue || fallbackTime}`;
}