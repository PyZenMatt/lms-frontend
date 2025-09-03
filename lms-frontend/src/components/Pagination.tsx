// src/components/Pagination.tsx
// React import not required with new JSX transform

type Props = {
  page: number;
  pageSize: number;
  total?: number;           // opzionale; se assente mostra solo prev/next
  onPageChange: (page: number) => void;
  className?: string;
};

export default function Pagination({ page, pageSize, total, onPageChange, className = "" }: Props) {
  const totalPages = typeof total === "number" ? Math.max(1, Math.ceil(total / pageSize)) : undefined;
  const canPrev = page > 1;
  const canNext = typeof totalPages === "number" ? page < totalPages : true;

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <div className="text-sm text-muted-foreground">
        {typeof totalPages === "number" ? (
          <>Pagina <span className="font-medium">{page}</span> di <span className="font-medium">{totalPages}</span></>
        ) : (
          <>Pagina <span className="font-medium">{page}</span></>
        )}
      </div>
      <div className="flex items-center gap-2">
        {typeof totalPages === "number" && (
          <button
            className="inline-flex h-9 items-center rounded-md border px-3 hover:bg-accent disabled:opacity-50"
            onClick={() => onPageChange(1)}
            disabled={!canPrev}
          >
            « Prima
          </button>
        )}
        <button
          className="inline-flex h-9 items-center rounded-md border px-3 hover:bg-accent disabled:opacity-50"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
        >
          ← Precedente
        </button>
        <button
          className="inline-flex h-9 items-center rounded-md border px-3 hover:bg-accent disabled:opacity-50"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
        >
          Successiva →
        </button>
        {typeof totalPages === "number" && (
          <button
            className="inline-flex h-9 items-center rounded-md border px-3 hover:bg-accent disabled:opacity-50"
            onClick={() => onPageChange(totalPages)}
            disabled={!canNext}
          >
            Ultima »
          </button>
        )}
      </div>
    </div>
  );
}
