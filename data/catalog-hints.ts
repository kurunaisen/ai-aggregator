export type CatalogHint = {
  id: string;
  label: string;
  href: string;
};

/** Быстрые сценарии — ведут сразу к подходящему инструменту */
export const catalogHints: CatalogHint[] = [
  // Изображения
  { id: "create-image", label: "Сделать изображение", href: "/tool/flux" },
  { id: "grok-image", label: "Картинка в Grok", href: "/tool/grok-imagine" },
  { id: "marketplace-photo", label: "Фото для маркетплейса", href: "/tool/nanobanana" },
  { id: "poster-cover", label: "Постер или обложка", href: "/tool/flux" },
  { id: "logo-icon", label: "Логотип или иконка", href: "/tool/nanobanana" },
  { id: "portrait", label: "Портрет по описанию", href: "/tool/grok-imagine" },
  { id: "concept-art", label: "Концепт-арт", href: "/tool/flux" },

  // Видео
  { id: "animate-photo", label: "Оживить фото", href: "/tool/runway" },
  { id: "create-video", label: "Создать видео", href: "/tool/kling" },
  { id: "video-from-text", label: "Видео из текста", href: "/tool/veo" },
  { id: "grok-video", label: "Видео в Grok", href: "/tool/grok-video" },
  { id: "reels-short", label: "Ролик для Reels", href: "/tool/kling" },
  { id: "cinematic-shot", label: "Кинематографичный кадр", href: "/tool/veo" },

  // Текст и учёба
  { id: "write-essay", label: "Написать реферат", href: "/tool/claude" },
  { id: "check-homework", label: "Проверить домашнюю работу", href: "/tool/chatgpt" },
  { id: "explain-topic", label: "Объяснить тему", href: "/tool/grok" },
  { id: "translate", label: "Перевести текст", href: "/tool/chatgpt" },
  { id: "write-resume", label: "Составить резюме", href: "/tool/claude" },
  { id: "write-email", label: "Написать письмо", href: "/tool/claude" },
  { id: "social-post", label: "Пост для соцсетей", href: "/tool/grok" },
  { id: "summarize-text", label: "Сократить текст", href: "/tool/claude" },
  { id: "make-plan", label: "Составить план", href: "/tool/chatgpt" },
  { id: "solve-math", label: "Решить задачу", href: "/tool/chatgpt" },
  { id: "headlines", label: "Придумать заголовки", href: "/tool/grok" },
  { id: "presentation", label: "Тезисы для презентации", href: "/tool/chatgpt" },
  { id: "rewrite-text", label: "Переписать своими словами", href: "/tool/claude" },

  // Код
  { id: "write-code", label: "Написать код", href: "/tool/monaco" },
  { id: "fix-bug", label: "Найти ошибку в коде", href: "/tool/monaco" },
  { id: "explain-code", label: "Объяснить код", href: "/tool/monaco" },
  { id: "write-sql", label: "Написать SQL-запрос", href: "/tool/monaco" },
];
