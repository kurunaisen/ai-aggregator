import { UsageBar } from "@/components/tools/embedded/UsageBar";
import type { DeaiSummary } from "@/lib/subscription/deai";

type EmbeddedToolHeaderProps = {
  toolName: string;
  deai: DeaiSummary;
};

export function EmbeddedToolHeader({ toolName, deai }: EmbeddedToolHeaderProps) {
  return (
    <div className="border-b divider-metallic px-5 py-4 sm:px-6">
      <h2 className="text-lg font-semibold text-silver">{toolName}</h2>
      <div className="mt-1">
        <UsageBar deai={deai} />
      </div>
    </div>
  );
}
