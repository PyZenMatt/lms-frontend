// src/components/CategoryFilter.tsx
// React import not required with new JSX transform
import { CATEGORIES } from "../services/courses";

type Props = {
  value?: string;
  onChange: (value?: string) => void;
  className?: string;
};

export default function CategoryFilter({ value, onChange, className = "" }: Props) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || undefined)}
      className={`h-9 rounded-md border bg-background px-2 text-sm ${className}`}
      title="Categoria"
    >
      <option value="">Tutte le categorie</option>
      {CATEGORIES.map((c) => (
        <option key={c} value={c}>
          {c.replace("-", " ")}
        </option>
      ))}
    </select>
  );
}
