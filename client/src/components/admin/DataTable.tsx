"use client";

import { ReactNode, useMemo, useState } from "react";
import { Edit2, Inbox, RefreshCw, Search, Trash2, TriangleAlert } from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
  width?: string;
}

interface DataTableProps<T extends { id: string | number }> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  actions?: (row: T) => ReactNode;
  /** Shows an error state (with Retry when onRetry is given) instead of the empty state. */
  error?: string;
  onRetry?: () => void;
  /** Return the text to match against; enables the search box. */
  searchText?: (row: T) => string;
  /** Accessible name of a row, used in "Edit …"/"Delete …" button labels. */
  rowLabel?: (row: T) => string;
}

function cellValue<T>(col: Column<T>, row: T): ReactNode {
  return col.render
    ? col.render(row)
    : String((row as Record<string, unknown>)[col.key as string] ?? "");
}

export default function DataTable<T extends { id: string | number }>({
  columns,
  data,
  onEdit,
  onDelete,
  loading,
  emptyMessage = "No entries yet.",
  actions,
  error,
  onRetry,
  searchText,
  rowLabel,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const hasActions = Boolean(onEdit || onDelete || actions);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchText) return data;
    return data.filter((row) => searchText(row).toLowerCase().includes(q));
  }, [data, query, searchText]);

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-2xl border border-white/6 bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  if (error && !data.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.04] px-6 py-10 text-center">
        <TriangleAlert size={22} className="text-red-300" />
        <p className="max-w-md text-sm text-red-200/90">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5"
          >
            <RefreshCw size={14} /> Try again
          </button>
        )}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/12 px-6 py-12 text-center">
        <Inbox size={22} className="text-white/30" />
        <p className="text-sm text-white/45">{emptyMessage}</p>
      </div>
    );
  }

  const label = (row: T) => rowLabel?.(row) ?? "item";

  const actionButtons = (row: T) => (
    <div className="flex items-center justify-end gap-1">
      {actions?.(row)}
      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(row)}
          className="rounded-lg p-2 text-white/45 transition hover:bg-white/10 hover:text-white"
          aria-label={`Edit ${label(row)}`}
          title="Edit"
        >
          <Edit2 size={14} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(row)}
          className="rounded-lg p-2 text-white/45 transition hover:bg-red-500/10 hover:text-red-400"
          aria-label={`Delete ${label(row)}`}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {searchText && (
        <div className="relative max-w-sm">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            aria-label="Search entries"
            className="w-full rounded-xl border px-3 py-2 pl-9 text-sm outline-none transition"
          />
        </div>
      )}

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/12 px-6 py-8 text-center text-sm text-white/45">
          Nothing matches “{query}”.
        </p>
      ) : (
        <>
          {/* Cards on small screens */}
          <ul className="space-y-2 md:hidden">
            {rows.map((row) => (
              <li key={row.id} className="rounded-2xl border border-white/8 bg-[#0d0d0d]/80 p-4">
                <div className="text-white/85">{cellValue(columns[0], row)}</div>
                {columns.length > 1 && (
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                    {columns.slice(1).map((col) => (
                      <div key={String(col.key)} className="min-w-0">
                        <dt className="font-mono text-[10px] uppercase tracking-widest text-white/35">{col.label}</dt>
                        <dd className="mt-1 text-sm text-white/80">{cellValue(col, row)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {hasActions && <div className="mt-3 border-t border-white/6 pt-2">{actionButtons(row)}</div>}
              </li>
            ))}
          </ul>

          {/* Table on larger screens */}
          <div className="hidden overflow-x-auto rounded-2xl border border-white/8 bg-[#0d0d0d]/80 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.02]">
                  {columns.map((col) => (
                    <th
                      key={String(col.key)}
                      scope="col"
                      className="px-4 py-3 text-left font-mono text-[11px] font-normal uppercase tracking-widest text-white/40"
                      style={col.width ? { width: col.width } : {}}
                    >
                      {col.label}
                    </th>
                  ))}
                  {hasActions && (
                    <th scope="col" className="w-28 px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-white/[0.05] transition last:border-b-0 hover:bg-white/[0.025]">
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-4 py-3 align-middle text-white/80">
                        {cellValue(col, row)}
                      </td>
                    ))}
                    {hasActions && <td className="px-4 py-3">{actionButtons(row)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
