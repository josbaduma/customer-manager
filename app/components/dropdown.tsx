"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

type DropdownItem = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type DropdownProps = {
  label: string;
  items: DropdownItem[];
  className?: string;
};

export function Dropdown({ label, items, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      >
        {label}
        <span aria-hidden="true">▾</span>
      </button>

      {open ? (
        <div
          ref={menuRef}
          className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-950"
        >
          {items.map((item) => (
            <DropdownLink key={item.label} item={item} onClose={() => setOpen(false)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

type DropdownLinkProps = {
  item: DropdownItem;
  onClose: () => void;
};

function DropdownLink({ item, onClose }: DropdownLinkProps) {
  if (item.href) {
    return (
      <a
        href={item.href}
        onClick={onClose}
        className="block px-4 py-3 text-sm text-slate-900 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900"
      >
        {item.label}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        item.onClick?.();
        onClose();
      }}
      className="w-full px-4 py-3 text-left text-sm text-slate-900 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900"
    >
      {item.label}
    </button>
  );
}
