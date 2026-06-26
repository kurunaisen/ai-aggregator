import type { Tool } from "@/types/tool";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToolCard } from "@/components/tools/ToolCard";

type ToolGridProps = {
  tools: Tool[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
};

export function ToolGrid({
  tools,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
}: ToolGridProps) {
  if (tools.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <ToolCard key={tool.slug} tool={tool} />
      ))}
    </div>
  );
}
