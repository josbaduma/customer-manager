"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  label: string;
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function Combobox({ label, options, value, onValueChange, placeholder }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <button
        type="button"
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm text-slate-950 shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50",
        )}
        onClick={() => {
          setOpen((current) => !current);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <span>{value || placeholder || "Seleccionar"}</span>
        <span className="text-slate-400">▾</span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-2 rounded-3xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-950">
          <div className="p-3">
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50"
              placeholder="Buscar opción..."
            />
          </div>
          <div className="max-h-48 overflow-y-auto px-3 pb-3">
            {filteredOptions.length === 0 ? (
              <div className="rounded-2xl px-3 py-2 text-sm text-slate-500">No se encontraron opciones.</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  key={option}
                  className="w-full rounded-2xl px-3 py-2 text-left text-sm text-slate-950 transition hover:bg-slate-100 dark:text-slate-50 dark:hover:bg-slate-800"
                  onClick={() => {
                    onValueChange(option);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {option}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
