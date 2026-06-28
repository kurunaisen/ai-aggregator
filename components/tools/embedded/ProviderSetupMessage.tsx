import type { EmbedConfig } from "@/data/embed-tools";
import { getProviderEnvVar } from "@/lib/tools/embed";

type ProviderSetupProps = {
  config: EmbedConfig;
};

const PROVIDER_LINKS: Partial<Record<string, string>> = {
  OPENAI_API_KEY: "https://platform.openai.com/api-keys",
  ANTHROPIC_API_KEY: "https://console.anthropic.com/settings/keys",
  XAI_API_KEY: "https://console.x.ai/",
  RUNWAY_API_KEY: "https://dev.runwayml.com/",
  GOOGLE_API_KEY: "https://aistudio.google.com/apikey",
  BFL_API_KEY: "https://api.bfl.ai/",
  KLING_API_KEY: "https://app.klingai.com/global/dev/api-key",
  KLING_ACCESS_KEY: "https://app.klingai.com/global/dev/api-key",
};

export function ProviderSetupMessage({ config }: ProviderSetupProps) {
  const envVar = getProviderEnvVar(config);
  const keyUrl = envVar ? PROVIDER_LINKS[envVar] : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center text-sm text-silver-dim">
      <p>
        {envVar ? (
          <>
            {envVar === "KLING_API_KEY" ? (
              <>
                Kling не настроен: задайте{" "}
                <code className="text-gold-light">KLING_API_KEY</code> — ключ из окна после
                Create. Если API отклонит авторизацию, добавьте{" "}
                <code className="text-gold-light">KLING_ACCESS_KEY</code> (колонка «API Key» в
                таблице) и тот же ключ из окна как{" "}
                <code className="text-gold-light">KLING_API_KEY</code> или{" "}
                <code className="text-gold-light">KLING_SECRET_KEY</code>.
              </>
            ) : envVar === "RUNWAY_API_KEY" ? (
              <>
                Runway не настроен: задайте <code className="text-gold-light">RUNWAY_API_KEY</code>.
                Ключ создаётся на dev.runwayml.com → Manage → New API key (показывается один раз).
                Credits на dev.runwayml.com отдельно от app.runwayml.com.
              </>
            ) : envVar === "BFL_API_KEY" ? (
              <>
                Переменная <code className="text-gold-light">BFL_API_KEY</code> не задана на сервере.
                Ключ берётся на{" "}
                <a
                  href="https://api.bfl.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-light underline"
                >
                  api.bfl.ai
                </a>
                .
              </>
            ) : (
              <>
                Переменная <code className="text-gold-light">{envVar}</code> не задана на сервере.
              </>
            )}
          </>
        ) : (
          "API провайдера не настроен на сервере."
        )}
      </p>
      <p className="max-w-md leading-relaxed">
        Добавьте ключ в{" "}
        <strong className="font-medium text-silver">Vercel → Settings → Environment Variables</strong>{" "}
        (Production) или в <code className="text-gold-light">.env.local</code> для локальной разработки,
        затем перезапустите сервер / сделайте redeploy.
      </p>
      {keyUrl && (
        <a
          href={keyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-light underline hover:text-gold"
        >
          Получить API-ключ ↗
        </a>
      )}
    </div>
  );
}
