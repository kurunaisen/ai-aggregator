export type CodeLanguageOption = {
  id: string;
  label: string;
  monacoId: string;
};

export const CODE_LANGUAGES: CodeLanguageOption[] = [
  { id: "typescript", label: "TypeScript", monacoId: "typescript" },
  { id: "javascript", label: "JavaScript", monacoId: "javascript" },
  { id: "python", label: "Python", monacoId: "python" },
  { id: "html", label: "HTML", monacoId: "html" },
  { id: "css", label: "CSS", monacoId: "css" },
  { id: "json", label: "JSON", monacoId: "json" },
  { id: "sql", label: "SQL", monacoId: "sql" },
  { id: "rust", label: "Rust", monacoId: "rust" },
  { id: "go", label: "Go", monacoId: "go" },
  { id: "java", label: "Java", monacoId: "java" },
];

export const DEFAULT_CODE_LANGUAGE = CODE_LANGUAGES[0];

export function getCodeLanguage(id: string): CodeLanguageOption {
  return CODE_LANGUAGES.find((lang) => lang.id === id) ?? DEFAULT_CODE_LANGUAGE;
}

export const MONACO_STARTER_CODE: Record<string, string> = {
  typescript: `// Monaco Editor на DeltaplanAI
export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("world"));
`,
  javascript: `// Monaco Editor на DeltaplanAI
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("world"));
`,
  python: `# Monaco Editor на DeltaplanAI
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("world"))
`,
  html: `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>DeltaplanAI</title>
  </head>
  <body>
    <h1>Monaco Editor</h1>
  </body>
</html>
`,
  css: `/* Monaco Editor на DeltaplanAI */
body {
  font-family: system-ui, sans-serif;
  background: #0a0a0a;
  color: #e8e8e8;
}
`,
  json: `{
  "name": "deltaplan-ai",
  "editor": "monaco"
}
`,
  sql: `-- Monaco Editor на DeltaplanAI
SELECT id, name
FROM users
WHERE active = true
LIMIT 10;
`,
  rust: `// Monaco Editor на DeltaplanAI
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    println!("{}", greet("world"));
}
`,
  go: `// Monaco Editor на DeltaplanAI
package main

import "fmt"

func main() {
    fmt.Println("Hello, world!")
}
`,
  java: `// Monaco Editor на DeltaplanAI
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}
`,
};

export function getStarterCode(languageId: string): string {
  return MONACO_STARTER_CODE[languageId] ?? MONACO_STARTER_CODE.javascript;
}
