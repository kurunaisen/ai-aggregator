"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
          },
        });
        if (error) throw error;
        setMessage("Проверьте почту для подтверждения или войдите, если аккаунт уже активен.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/account");
        router.refresh();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    });
    if (error) {
      setMessage(error.message);
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
        className="w-full"
        disabled={loading}
        onClick={() => void signInWithGoogle()}
      >
        Войти через Google
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
