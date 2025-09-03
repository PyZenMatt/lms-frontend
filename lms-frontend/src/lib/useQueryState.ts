// src/lib/useQueryState.ts
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export type QueryShape = Record<string, string | number | undefined | null | boolean>;

/**
 * Piccolo helper per sincronizzare oggetti "query" con l'URL.
 * - setQuery({ page: 2, search: "react" }) => aggiorna i parametri nell'URL
 * - getQuery() => oggetto con i valori tipici
 */
export function useQueryState<T extends QueryShape>(defaults: Partial<T> = {} as Partial<T>) {
  const [params, setParams] = useSearchParams();

  const getQuery = useCallback(() => {
    const out: any = { ...defaults };
    params.forEach((v, k) => {
      if (v === "true") out[k] = true;
      else if (v === "false") out[k] = false;
      else if (!Number.isNaN(Number(v)) && v.trim() !== "") out[k] = Number(v);
      else out[k] = v;
    });
    return out as T;
  }, [params, defaults]);

  const setQuery = useCallback(
    (patch: Partial<T>, options?: { replace?: boolean }) => {
      const next = new URLSearchParams(params);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") next.delete(k);
        else next.set(k, String(v));
      });
      setParams(next, { replace: options?.replace ?? false });
    },
    [params, setParams]
  );

  return { getQuery, setQuery };
}
