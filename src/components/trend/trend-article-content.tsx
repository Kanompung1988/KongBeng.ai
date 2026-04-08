"use client";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/lib/i18n/context";

interface Props {
  article: {
    title: string;
    titleTh: string | null;
    content: string;
    contentTh: string | null;
    tags: string[];
    source: string | null;
  };
}

export function TrendArticleContent({ article }: Props) {
  const { lang } = useLanguage();
  const title = (lang === "th" && article.titleTh) || article.title;
  const content = (lang === "th" && article.contentTh) || article.content;

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-8">
        {title}
      </h1>

      {/* Content */}
      <div className="prose prose-invert prose-emerald max-w-none
        prose-headings:text-foreground prose-headings:font-bold
        prose-p:text-muted-foreground prose-p:leading-relaxed
        prose-strong:text-foreground
        prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
        prose-li:text-muted-foreground
        prose-blockquote:border-emerald-500/50 prose-blockquote:text-muted-foreground
      ">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-6 mt-8 border-t border-border/50">
          {article.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-lg bg-muted text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Source */}
      {article.source && (
        <p className="text-xs text-muted-foreground mt-4 italic">
          Source: {article.source}
        </p>
      )}
    </>
  );
}
