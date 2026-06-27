import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DEAI_PRICING_HINT, FREE_STARTING_DEAI } from "@/lib/subscription/constants";

type LoginPromptProps = {
  toolName: string;
};

export function LoginPrompt({ toolName }: LoginPromptProps) {
  return (
    <div className="carbon-panel flex min-h-[320px] flex-col items-center justify-center rounded-2xl px-6 py-12 text-center">
      <h2 className="text-xl font-semibold text-silver">{toolName} на DeltaplanAI</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-silver-dim">
        Войдите или зарегистрируйтесь, чтобы генерировать запросы прямо на сайте.
        Free — {FREE_STARTING_DEAI} Deai: текст {DEAI_PRICING_HINT.text}, изображения{" "}
        {DEAI_PRICING_HINT.image}, видео {DEAI_PRICING_HINT.video}.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/login">Войти</Button>
        <Button href="/signup" variant="outline">
          Регистрация
        </Button>
      </div>
      <p className="mt-6 text-xs text-silver-dim">
        <Link href="/pricing" className="text-gold-light hover:underline">
          Тарифы
        </Link>
      </p>
    </div>
  );
}
