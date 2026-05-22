"use client";
import { Fragment } from "react";

interface Props {
  content: string;
}

/**
 * Markdown renderer tối giản: chỉ hiểu **bold**, *italic*, bullet `- `, paragraph break.
 * Đủ dùng cho output của Gemini ở phase 1 — không cần thêm dependency.
 */
export function MarkdownLite({ content }: Props) {
  const blocks = splitBlocks(content);
  return (
    <div className="space-y-2 leading-relaxed text-foreground">
      {blocks.map((b, i) => {
        if (b.type === "ul") {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1">
              {b.items.map((li, j) => (
                <li key={j}>{renderInline(li)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {renderInline(b.text)}
          </p>
        );
      })}
    </div>
  );
}

type Block = { type: "p"; text: string } | { type: "ul"; items: string[] };

function splitBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: Block[] = [];
  let buf: string[] = [];
  let listBuf: string[] = [];

  const flushPara = () => {
    if (buf.length) {
      out.push({ type: "p", text: buf.join("\n").trim() });
      buf = [];
    }
  };
  const flushList = () => {
    if (listBuf.length) {
      out.push({ type: "ul", items: listBuf });
      listBuf = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      flushPara();
      listBuf.push(bullet[1]);
    } else if (line === "") {
      flushPara();
      flushList();
    } else {
      flushList();
      buf.push(line);
    }
  }
  flushPara();
  flushList();
  return out;
}

function renderInline(text: string) {
  // Pattern: **bold** | *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {p.slice(2, -2)}
        </strong>
      );
    }
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
      return (
        <em key={i} className="italic text-muted-foreground">
          {p.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}
