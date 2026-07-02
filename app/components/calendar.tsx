"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const weekDays = ["D", "L", "M", "M", "J", "V", "S"];
const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    const date = new Date(selectedDate || new Date().toISOString());
    return date.getMonth();
  });

  const [currentYear, setCurrentYear] = React.useState(() => {
    const date = new Date(selectedDate || new Date().toISOString());
    return date.getFullYear();
  });

  const selected = React.useMemo(() => new Date(selectedDate), [selectedDate]);

  const monthStart = new Date(currentYear, currentMonth, 1);
  const firstDayIndex = monthStart.getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  function handlePreviousMonth() {
    setCurrentMonth((month) => {
      if (month === 0) {
        setCurrentYear((year) => year - 1);
        return 11;
      }
      return month - 1;
    });
  }

  function handleNextMonth() {
    setCurrentMonth((month) => {
      if (month === 11) {
        setCurrentYear((year) => year + 1);
        return 0;
      }
      return month + 1;
    });
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-3 pb-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Calendario</p>
          <p className="text-base font-semibold text-slate-950 dark:text-slate-50">
            {monthNames[currentMonth]} {currentYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePreviousMonth}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-950 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-950 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {weekDays.map((weekDay, index) => (
          <div key={`${weekDay}-${index}`}>{weekDay}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 pt-3">
        {Array.from({ length: firstDayIndex }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = new Date(currentYear, currentMonth, day);
          const dateString = formatDate(date);
          const isSelected = dateString === selectedDate;

          return (
            <button
              key={dateString}
              type="button"
              className={cn(
                "aspect-square rounded-2xl text-sm font-medium transition",
                isSelected
                  ? "bg-slate-950 text-white dark:bg-slate-50 dark:text-slate-950"
                  : "bg-slate-50 text-slate-950 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800",
              )}
              onClick={() => onSelectDate(dateString)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
