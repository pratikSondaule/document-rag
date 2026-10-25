import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

const components = {
  pre: ({ children }) => <>{children}</>,
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className || "");
    const text = String(children).replace(/\n$/, "");
    if (!match && !text.includes("\n")) {
      return (
        <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.85em] text-slate-800">
          {text}
        </code>
      );
    }
    return (
      <div className="my-3 overflow-hidden rounded-lg border border-slate-200">
        <SyntaxHighlighter
          language={match?.[1] ?? "text"}
          style={oneLight}
          customStyle={{ margin: 0, fontSize: 13, background: "#f8fafc" }}
        >
          {text}
        </SyntaxHighlighter>
      </div>
    );
  },
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
    >
      {children}
    </a>
  ),
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
  ),
  h1: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mb-1.5 mt-3 text-sm font-semibold">{children}</h4>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-slate-200 pl-3 text-slate-600">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-slate-200 px-3 py-2 font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-slate-100 px-3 py-2">{children}</td>
  ),
};

export default function MarkdownContent({ children }) {
  return (
    <div className="break-words text-sm leading-relaxed text-slate-800">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
