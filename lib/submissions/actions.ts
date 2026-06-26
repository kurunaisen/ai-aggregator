"use server";

import { createAnonClient } from "@/lib/supabase/anon";
import type { SubmissionInsert } from "@/lib/supabase/database.types";

export type SubmitToolState = {
  ok: boolean;
  message: string;
};

export async function submitTool(
  _prevState: SubmitToolState,
  formData: FormData,
): Promise<SubmitToolState> {
  const name = formData.get("name")?.toString().trim();
  const url = formData.get("url")?.toString().trim();
  const category = formData.get("category")?.toString().trim();
  const description = formData.get("description")?.toString().trim();

  if (!name || !url || !category || !description) {
    return { ok: false, message: "Заполните все поля формы." };
  }

  try {
    new URL(url);
  } catch {
    return { ok: false, message: "Укажите корректную ссылку на сайт." };
  }

  const payload: SubmissionInsert = {
    name,
    url,
    category,
    description,
    status: "pending",
  };

  const supabase = createAnonClient();
  if (!supabase) {
    return { ok: false, message: "Supabase не настроен. Проверьте переменные окружения." };
  }

  const { error } = await supabase.from("submissions").insert(payload);

  if (error) {
    console.error("submitTool:", error.message);
    return {
      ok: false,
      message: "Не удалось отправить заявку. Попробуйте позже.",
    };
  }

  return {
    ok: true,
    message: "Заявка отправлена! Мы рассмотрим её и добавим инструмент в каталог.",
  };
}
