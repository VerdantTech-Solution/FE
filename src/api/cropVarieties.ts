export type CropVarietySuggestion = {
  name: string;
  description?: string;
  source?: string;
};

type CropVarietyPayload =
  | string
  | CropVarietySuggestion
  | {
      [key: string]: unknown;
    };

const pickName = (item: Record<string, unknown>): string => {
  return (
    (item.name as string) ||
    (item.variety as string) ||
    (item.title as string) ||
    (item.label as string) ||
    (item.cropName as string) ||
    (item.value as string) ||
    ""
  );
};

const parseStringList = (value: string): CropVarietySuggestion[] => {
  return value
    .split(/[\n,]/)
    .map((entry) => entry.replace(/^[\-\*\•]\s*/, "").trim())
    .filter(Boolean)
    .map((name) => ({ name }));
};

const toSuggestion = (entry: CropVarietyPayload): CropVarietySuggestion | null => {
  if (typeof entry === "string") {
    const name = entry.trim();
    return name ? { name } : null;
  }

  if (entry && typeof entry === "object") {
    const record = entry as Record<string, unknown>;
    const name = pickName(record).trim();
    if (!name) {
      return null;
    }

    const description =
      (record.description as string) ||
      (record.details as string) ||
      (record.detail as string) ||
      (record.note as string) ||
      (record.subtitle as string);

    const source = (record.source as string) || (record.origin as string);

    return { name, description, source };
  }

  return null;
};

const parseArray = (value: unknown[]): CropVarietySuggestion[] => {
  return value
    .map((item) => toSuggestion(item as CropVarietyPayload))
    .filter((item): item is CropVarietySuggestion => Boolean(item));
};

const normalizePayload = (payload: unknown): CropVarietySuggestion[] => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return parseArray(payload);
  }

  if (typeof payload === "string") {
    return parseStringList(payload);
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    const candidateKeys = ["varieties", "data", "results", "items", "list", "options", "suggestions", "choices"];
    for (const key of candidateKeys) {
      const value = record[key];
      if (Array.isArray(value)) {
        return parseArray(value);
      }
      if (typeof value === "string") {
        const parsed = parseStringList(value);
        if (parsed.length) {
          return parsed;
        }
      }
    }

    if (typeof record.text === "string") {
      return parseStringList(record.text);
    }
  }

  return [];
};

export const getCropVarietySuggestions = async (cropName: string): Promise<CropVarietySuggestion[]> => {
  const endpoint = import.meta.env.VITE_API_AI_CROP;

  if (!endpoint) {
    throw new Error("Biến môi trường VITE_API_AI_CROP chưa được cấu hình.");
  }

  const payload = {
    cropName: cropName.trim(),
  };

  if (!payload.cropName) {
    throw new Error("Vui lòng nhập tên rau củ trước khi lấy gợi ý giống.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();

  if (!response.ok) {
    let errorMessage = `Không thể lấy gợi ý (HTTP ${response.status}).`;
    try {
      const errorData = raw ? JSON.parse(raw) : null;
      errorMessage =
        (errorData?.message as string) ||
        (errorData?.error as string) ||
        (errorData?.hint as string) ||
        errorMessage;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  let parsed: unknown = raw;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    // response might already be plain text list
  }

  const suggestions = normalizePayload(parsed);

  if (!suggestions.length) {
    if (parsed && typeof parsed === "object" && "message" in (parsed as Record<string, unknown>)) {
      throw new Error(String((parsed as Record<string, unknown>).message));
    }
  }

  return suggestions;
};


