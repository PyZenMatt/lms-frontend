// src/components/DrfPager.tsx
// React import not required with new JSX transform

type Props = {
  page: number;
  count?: number | null;       // totale elementi (DRF count)
  pageSize?: number;           // default 10
  onPageChange: (page: number) => void;
  className?: string;
};

export default function DrfPager({
  page,
  count,
  pageSize = 10,
  onPageChange,
  className,
}: Props) {
  const totalPages =
    typeof count === "number" && count >= 0
      ? Math.max(1, Math.ceil(count / pageSize))
      : 1;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className={`flex items-center justify-between gap-2 ${className ?? ""}`}>
      <button
        disabled={!canPrev}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex h-9 items-center rounded-md border px-3 hover:bg-accent disabled:opacity-50"
      >
        ← Precedente
      </button>
      <div className="text-sm text-muted-foreground">
        Pagina <span className="font-medium">{page}</span>
        {typeof count === "number" ? (
          <> di <span className="font-medium">{totalPages}</span></>
        ) : null}
      </div>
      <button
        disabled={!canNext}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex h-9 items-center rounded-md border px-3 hover:bg-accent disabled:opacity-50"
      >
        Successiva →
      </button>
    </div>
  );
}
