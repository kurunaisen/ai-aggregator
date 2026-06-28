"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

type AuthFormProps = {
  mode: "login" | "signup";
  initialMessage?: string | null;
};

const OAUTH_REDIRECT = "/auth/callback?next=/profile";
const YANDEX_PROVIDER = "custom:yandex" as Provider;
const YANDEX_SCOPES = "login:email login:info";

export function AuthForm({ mode, initialMessage = null }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(initialMessage);

  async function signInWithOAuthProvider(provider: Provider, scopes?: string) {
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}${OAUTH_REDIRECT}`,
        ...(scopes ? { scopes } : {}),
        ...(provider === YANDEX_PROVIDER
          ? { queryParams: { force_confirm: "yes" } }
          : {}),
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${OAUTH_REDIRECT}`,
          },
        });
        if (error) throw error;
        setMessage("Проверьте почту для подтверждения или войдите, если аккаунт уже активен.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/profile");
        router.refresh();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="carbon-panel rounded-2xl p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <p className="rounded-lg border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-gold-light">
            {message}
          </p>
        )}

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-silver">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-theme w-full rounded-xl px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-silver">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-theme w-full rounded-xl px-4 py-3 text-sm"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 divider-metallic bg-border" />
        <span className="text-xs text-silver-dim">или</span>
        <div className="h-px flex-1 divider-metallic bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        disabled={loading}
        onClick={() => void signInWithOAuthProvider(YANDEX_PROVIDER, YANDEX_SCOPES)}
      >
        <YandexIcon className="h-4 w-4 shrink-0" />
        Войти через Яндекс
      </Button>

      <Button
        type="button"
        variant="outline"
        className="mt-3 w-full"
        disabled={loading}
        onClick={() => void signInWithOAuthProvider("google")}
      >
        Войти через Google
      </Button>

      <Button
        type="button"
        variant="outline"
        className="mt-3 w-full"
        disabled={loading}
        onClick={() => void signInWithOAuthProvider("github")}
      >
        Войти через GitHub
      </Button>

      <p className="mt-6 text-center text-sm text-silver-dim">
        {mode === "login" ? (
          <>
            Нет аккаунта?{" "}
            <Link href="/signup" className="text-gold-light hover:underline">
              Регистрация
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-gold-light hover:underline">
              Войти
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function YandexIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#FC3F1D" />
      <path
        fill="#fff"
        d="M13.32 17h-2.05V7.27h-3.1V5.4h8.25V17h-2.05v-4.62h-1.05V17z"
      />
    </svg>
  );
}
