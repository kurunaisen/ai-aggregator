import type { EmbedConfig } from "@/data/embed-tools";
import { getProviderEnvVar } from "@/lib/tools/embed";

type ProviderSetupProps = {
  config: EmbedConfig;
};

const PROVIDER_LINKS: Partial<Record<string, string>> = {
  OPENAI_API_KEY: "https://platform.openai.com/api-keys",
  ANTHROPIC_API_KEY: "https://console.anthropic.com/settings/keys",
  RUNWAY_API_KEY: "https://dev.runwayml.com/",
  GOOGLE_API_KEY: "https://aistudio.google.com/apikey",
};

export function ProviderSetupMessage({ config }: ProviderSetupProps) {
  const envVar = getProviderEnvVar(config);
  const keyUrl = envVar ? PROVIDER_LINKS[envVar] : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center text-sm text-silver-dim">
      <p>
        {envVar ? (
          <>
            Переменная <code className="text-gold-light">{envVar}</code> не задана на сервере.
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
