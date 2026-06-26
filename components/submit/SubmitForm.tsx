"use client";

import { useActionState } from "react";
import { categories } from "@/data/categories";
import { submitTool, type SubmitToolState } from "@/lib/submissions/actions";
import { Button } from "@/components/ui/Button";

const initialState: SubmitToolState = { ok: false, message: "" };

const inputClassName =
  "w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20";

export function SubmitForm() {
  const [state, formAction, pending] = useActionState(submitTool, initialState);

  if (state.ok) {
    return (
      <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
        <p className="text-lg font-medium text-emerald-300">Спасибо!</p>
        <p className="mt-2 text-sm text-emerald-400/80">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-10 space-y-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8"
    >
      {state.message && !state.ok && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {state.message}
        </p>
      )}

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-zinc-300">
          Название
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="ChatGPT"
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="url" className="mb-2 block text-sm font-medium text-zinc-300">
          Ссылка на сайт
        </label>
        <input
          id="url"
          name="url"
          type="url"
          required
          placeholder="https://example.com"
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="category" className="mb-2 block text-sm font-medium text-zinc-300">
          Категория
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue=""
          className={inputClassName}
        >
          <option value="" disabled>
            Выберите категорию
          </option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium text-zinc-300">
          Описание
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          required
          placeholder="Кратко опишите, для чего подходит инструмент..."
          className={inputClassName}
        />
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Отправка..." : "Отправить заявку"}
      </Button>
    </form>
  );
}
