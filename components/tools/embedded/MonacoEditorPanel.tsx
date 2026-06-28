"use client";

import dynamic from "next/dynamic";
import type { CodeLanguageOption } from "@/data/code-languages";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-silver-dim">
      Загрузка редактора...
    </div>
  ),
});

type MonacoEditorPanelProps = {
  language: CodeLanguageOption;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export function MonacoEditorPanel({
  language,
  value,
  onChange,
  readOnly = false,
}: MonacoEditorPanelProps) {
  return (
    <div className="overflow-hidden rounded-xl border divider-metallic">
      <MonacoEditor
        height="360px"
        language={language.monacoId}
        value={value}
        theme="vs-dark"
        onChange={(next) => onChange(next ?? "")}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
}
