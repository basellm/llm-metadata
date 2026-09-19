import type { ReactNode } from 'react';

/** 详情页分区：左标签（可带说明）右内容（OpenAI 式） */
export function DetailSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 border-t py-8 md:grid-cols-[200px_minmax(0,1fr)]">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        {hint && <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
