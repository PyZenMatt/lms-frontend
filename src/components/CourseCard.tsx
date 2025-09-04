// src/components/CourseCard.tsx
// React import not required with new JSX transform

export type Course = {
  id: number | string;
  title: string;
  description?: string;
  cover_image?: string | null;
  price?: number | string | null;
  currency?: string | null;
  // compat
  price_amount?: number | string | null;
  price_currency?: string | null;
  category?: string | null | { slug?: string; name?: string };
  created_at?: string;
  lessons_count?: number | null;
  students_count?: number | null;
  progress_percent?: number | null;
};

type Props = {
  course: Course;
  showProgress?: boolean;
  showStats?: boolean;
  onOpen?: (id: Course["id"]) => void;
};

// ---- helpers ----
function extractPrice(c: Course): { value: number | null; currency: string } {
  const raw =
    c.price ??
    c.price_amount ??
    (typeof (c as any).price === "object" ? (c as any).price?.value : null);

  let num: number | null = null;
  if (typeof raw === "number") num = raw;
  else if (typeof raw === "string") {
    const p = parseFloat(raw.replace(",", "."));
    num = Number.isFinite(p) ? p : null;
  }

  const cur =
    c.currency ??
    c.price_currency ??
    (typeof (c as any).price === "object" ? (c as any).price?.currency : null) ??
    "EUR";

  return { value: num, currency: (cur || "EUR").toString().toUpperCase() };
}

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    const sym = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency + " ";
    return `${sym}${value.toFixed(2)}`;
  }
}

function categoryLabel(c: Course): string | null {
  const val = c.category as any;
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object") return val.name || val.slug || null;
  return null;
}

export default function CourseCard({ course, showProgress, showStats, onOpen }: Props) {
  const { value: priceValue, currency } = extractPrice(course);
  const cat = categoryLabel(course);

  const handleOpen = () => {
    if (onOpen) onOpen(course.id);
    else window.location.assign(`/courses/${course.id}`);
  };

  return (
    <div className="group overflow-hidden rounded-lg border hover:shadow-sm transition">
      {course.cover_image ? (
        <img src={course.cover_image} alt={course.title} className="h-40 w-full object-cover" loading="lazy" />
      ) : (
        <div className="h-40 w-full bg-muted" />
      )}

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-base font-semibold">{course.title}</h3>
          {typeof priceValue === "number" && (
            <div className="shrink-0 text-sm font-semibold">
              {formatCurrency(priceValue, currency)}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {cat && (
            <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs">
              {String(cat).replace("-", " ")}
            </span>
          )}
        </div>

        {course.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
        )}

        {showProgress && typeof course.progress_percent === "number" && (
          <div className="mt-1">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Progresso</span>
              <span>{Math.round(course.progress_percent)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded bg-muted">
              <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, course.progress_percent))}%` }} />
            </div>
          </div>
        )}

        {showStats && (
          <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>Studenti: <span className="font-medium">{course.students_count ?? "-"}</span></div>
            <div>Lezioni: <span className="font-medium">{course.lessons_count ?? "-"}</span></div>
          </div>
        )}

        <div className="pt-2">
          <button onClick={handleOpen} className="inline-flex h-9 items-center rounded-md border px-3 hover:bg-accent">
            Vai al corso
          </button>
        </div>
      </div>
    </div>
  );
}
