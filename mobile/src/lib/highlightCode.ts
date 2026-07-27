import Prism, { Token } from "prismjs";
// Grammar dependency order matters: clike before javascript, javascript
// before typescript/jsx, jsx+typescript before tsx, markup+css before clike
// isn't required but markup is needed for jsx's embedded-HTML highlighting.
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-go";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-php";
import "prismjs/components/prism-ruby";

const ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  py: "python",
  yml: "yaml",
  "c++": "cpp",
  "c#": "csharp",
  cs: "csharp",
  html: "markup",
  xml: "markup",
  rb: "ruby",
  golang: "go",
};

export type CodeToken = string | { type: string; content: CodeToken[] | string };

export function resolveLanguage(language?: string): string | undefined {
  if (!language) return undefined;
  const normalized = language.trim().toLowerCase();
  const resolved = ALIASES[normalized] ?? normalized;
  return Prism.languages[resolved] ? resolved : undefined;
}

/** Tokenizes code with Prism; returns plain-text tokens if the language/grammar isn't available. */
export function tokenizeCode(code: string, language?: string): CodeToken[] {
  const resolved = resolveLanguage(language);
  if (!resolved) return [code];

  const tokens = Prism.tokenize(code, Prism.languages[resolved]);
  return tokens.map(toCodeToken);
}

function toCodeToken(token: string | Token): CodeToken {
  if (typeof token === "string") return token;
  if (typeof token.content === "string") {
    return { type: token.type, content: token.content };
  }
  const nested = Array.isArray(token.content) ? token.content : [token.content];
  return { type: token.type, content: nested.map(toCodeToken) };
}
