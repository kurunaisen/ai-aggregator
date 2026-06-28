export const CANVA_DESIGN_DEAI = 2;

export type CanvaPresetName =
  | "doc"
  | "whiteboard"
  | "presentation"
  | "instagram-post"
  | "facebook-post"
  | "poster"
  | "logo"
  | "flyer"
  | "youtube-thumbnail";

export type CanvaDesignPreset = {
  value: CanvaPresetName;
  label: string;
  hint?: string;
};

export const CANVA_DESIGN_PRESETS: CanvaDesignPreset[] = [
  { value: "doc", label: "Документ", hint: "A4, тексты и макеты" },
  { value: "presentation", label: "Презентация", hint: "Слайды 16:9" },
  { value: "instagram-post", label: "Instagram", hint: "Квадрат 1080×1080" },
  { value: "facebook-post", label: "Facebook", hint: "Пост для ленты" },
  { value: "poster", label: "Постер", hint: "Плакат и афиша" },
  { value: "logo", label: "Логотип", hint: "Брендинг" },
  { value: "flyer", label: "Флаер", hint: "Листовка" },
  { value: "youtube-thumbnail", label: "YouTube", hint: "Обложка видео" },
  { value: "whiteboard", label: "Whiteboard", hint: "Доска для идей" },
];

export type CanvaCreateDesignRequest = {
  title: string;
  preset: CanvaPresetName;
};

export function validateCanvaDesignRequest(
  body: unknown,
): CanvaCreateDesignRequest | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Некорректное тело запроса." };
  }

  const { title, preset } = body as Record<string, unknown>;
  const trimmedTitle = typeof title === "string" ? title.trim() : "";

  if (!trimmedTitle) {
    return { error: "Укажите название дизайна." };
  }

  if (trimmedTitle.length > 120) {
    return { error: "Название не длиннее 120 символов." };
  }

  if (typeof preset !== "string" || !CANVA_DESIGN_PRESETS.some((item) => item.value === preset)) {
    return { error: "Выберите формат дизайна." };
  }

  return {
    title: trimmedTitle,
    preset: preset as CanvaPresetName,
  };
}
