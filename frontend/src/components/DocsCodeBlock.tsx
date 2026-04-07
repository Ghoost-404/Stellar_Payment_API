"use client";

import { isValidElement, useMemo, useState, type HTMLAttributes, type ReactNode } from "react";

type PreProps = HTMLAttributes<HTMLPreElement> & {
  children?: ReactNode;
};

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return extractText(node.props.children);
  return "";
}

export default function DocsCodeBlock({ children, className = "", ...rest }: PreProps) {
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => extractText(children).replace(/\n$/, ""), [children]);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="relative my-7">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-3 top-3 z-10 rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white transition-colors hover:border-white/30 hover:bg-black/60"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre {...rest} className={`${className} !my-0`}>
        {children}
      </pre>
    </div>
  );
}
