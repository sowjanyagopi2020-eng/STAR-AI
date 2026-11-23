import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface FormattedAITextProps {
  text: string;
  className?: string;
}

function renderInlineFormatting(line: string): React.ReactNode[] {
  // Split inline code (`...`) and bold (**...**) cleanly
  const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/80 text-blue-700 dark:text-amber-300 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 text-[11px]">
      <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <span className="font-mono uppercase tracking-wider">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const FormattedAIText: React.FC<FormattedAITextProps> = ({ text, className = '' }) => {
  // Split into fenced code blocks vs prose blocks
  const segments = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-1.5 leading-relaxed ${className}`}>
      {segments.map((segment, segIdx) => {
        if (segment.startsWith('```') && segment.endsWith('```')) {
          const inner = segment.slice(3, -3);
          const firstNewline = inner.indexOf('\n');
          const language = firstNewline !== -1 ? inner.slice(0, firstNewline).trim() : '';
          const code = firstNewline !== -1 ? inner.slice(firstNewline + 1).trimEnd() : inner.trim();
          return <CodeBlock key={segIdx} language={language} code={code} />;
        }

        const lines = segment.split('\n');
        const nodes: React.ReactNode[] = [];
        let i = 0;

        while (i < lines.length) {
          const line = lines[i];
          const trimmed = line.trim();

          if (!trimmed) {
            nodes.push(<div key={`${segIdx}-${i}`} className="h-1" />);
            i++;
            continue;
          }

          // Markdown table detection
          if (
            trimmed.startsWith('|') &&
            i + 1 < lines.length &&
            /^\|\s*[:\-| ]+\s*\|?$/.test(lines[i + 1].trim())
          ) {
            const parseRow = (rowStr: string) =>
              rowStr
                .replace(/^\|/, '')
                .replace(/\|$/, '')
                .split('|')
                .map(c => c.trim());

            const headers = parseRow(trimmed);
            i += 2; // Skip header and separator row
            const rows: string[][] = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
              rows.push(parseRow(lines[i].trim()));
              i++;
            }

            nodes.push(
              <div
                key={`${segIdx}-tbl-${i}`}
                className="my-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold">
                    <tr>
                      {headers.map((h, hi) => (
                        <th key={hi} className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                          {renderInlineFormatting(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((r, ri) => (
                      <tr key={ri}>
                        {r.map((cell, ci) => (
                          <td key={ci} className="px-3 py-1.5 text-slate-700 dark:text-slate-300">
                            {renderInlineFormatting(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            continue;
          }

          if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
            const headingText = trimmed.replace(/^#{1,3}\s+/, '');
            nodes.push(
              <h4
                key={`${segIdx}-${i}`}
                className="font-bold text-slate-900 dark:text-white pt-1.5 text-[13px]"
              >
                {renderInlineFormatting(headingText)}
              </h4>
            );
            i++;
            continue;
          }

          // Numbered list item (e.g. 1. Step one)
          const numberedMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
          if (numberedMatch) {
            nodes.push(
              <div key={`${segIdx}-${i}`} className="flex items-start gap-2 pl-1">
                <span className="text-blue-600 dark:text-amber-400 font-semibold tabular-nums shrink-0">
                  {numberedMatch[1]}
                </span>
                <span className="flex-1">{renderInlineFormatting(numberedMatch[2])}</span>
              </div>
            );
            i++;
            continue;
          }

          if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            const bulletText = trimmed.slice(2);
            nodes.push(
              <div key={`${segIdx}-${i}`} className="flex items-start gap-2 pl-1">
                <span className="text-blue-600 dark:text-blue-400 font-bold leading-snug">•</span>
                <span className="flex-1">{renderInlineFormatting(bulletText)}</span>
              </div>
            );
            i++;
            continue;
          }

          nodes.push(<p key={`${segIdx}-${i}`}>{renderInlineFormatting(line)}</p>);
          i++;
        }

        return <React.Fragment key={segIdx}>{nodes}</React.Fragment>;
      })}
    </div>
  );
};
