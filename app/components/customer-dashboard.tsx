"use client";

import * as React from "react";
import type { Customer } from "../generated/prisma/client";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Dialog } from "./dialog";

type CustomerWithRelations = Customer & {
  stores: Array<{
    id: number;
    name: string;
    location: string;
    bills: Array<{
      id: number;
      total: number;
      products: Array<{ id: number }>; 
    }>;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

interface CustomerDashboardProps {
  customers: CustomerWithRelations[];
}

export function CustomerDashboard({ customers }: CustomerDashboardProps) {
  const [openDialog, setOpenDialog] = React.useState(false);

  const totalClientes = customers.length;
  const totalTiendas = customers.reduce((sum, customer) => sum + customer.stores.length, 0);

  const customersWithTotals = customers.map((customer) => {
    const cobrado = customer.stores.reduce((storeSum, store) => {
      return (
        storeSum +
        store.bills.reduce((billSum, bill) => billSum + bill.total, 0)
      );
    }, 0);

    const camisetas = customer.stores.reduce((storeSum, store) => {
      return (
        storeSum +
        store.bills.reduce((billSum, bill) => billSum + bill.products.length, 0)
      );
    }, 0);

    return {
      customer,
      cobrado,
      pendiente: Math.round(cobrado * 0.3),
      tiendas: customer.stores.length,
      camisetas,
    };
  });

  const totalCobrado = customersWithTotals.reduce((sum, item) => sum + item.cobrado, 0);
  const totalPendiente = customersWithTotals.reduce((sum, item) => sum + item.pendiente, 0);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <main className="mx-auto w-full max-w-6xl space-y-8 pb-10">
        <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white px-8 py-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Clientes</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Resumen general de tus clientes, tiendas y facturación.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Clientes</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950 dark:text-slate-50">{totalClientes}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Tiendas</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950 dark:text-slate-50">{totalTiendas}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-emerald-100/80 p-6 text-center shadow-sm dark:border-slate-800 dark:bg-emerald-950/10">
              <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Cobrado</p>
              <p className="mt-4 text-3xl font-semibold text-emerald-900 dark:text-emerald-300">{formatCurrency(totalCobrado)}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-amber-100/80 p-6 text-center shadow-sm dark:border-slate-800 dark:bg-amber-950/10">
              <p className="text-sm uppercase tracking-[0.24em] text-amber-700">Pendiente</p>
              <p className="mt-4 text-3xl font-semibold text-amber-900 dark:text-amber-300">{formatCurrency(totalPendiente)}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">Listado de clientes</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Detalles de facturación y tiendas por cliente.
              </p>
            </div>
            <Button onClick={() => setOpenDialog(true)}>Nuevo cliente</Button>
          </div>

          <div className="grid gap-4">
            {customersWithTotals.map(({ customer, cobrado, pendiente, tiendas, camisetas }) => (
              <article
                key={customer.id}
                className="grid gap-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-3xl bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50">
                      <span className="text-xl">🏬</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{customer.name}</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{customer.email}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm dark:bg-slate-950">
                          <span>🏬</span>
                          {tiendas} {tiendas === 1 ? "tienda" : "tiendas"}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm dark:bg-slate-950">
                          <span>👕</span>
                          {camisetas} camisetas
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 text-right sm:text-left">
                    <div className="rounded-3xl bg-emerald-50 p-3 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <p className="text-xs uppercase tracking-[0.24em]">Cobrado</p>
                      <p className="mt-1 text-lg font-semibold">{formatCurrency(cobrado)}</p>
                    </div>
                    <div className="rounded-3xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
                      <p className="text-xs uppercase tracking-[0.24em]">Pendiente</p>
                      <p className="mt-1 text-lg font-semibold">{formatCurrency(pendiente)}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Dialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        title="Nuevo cliente"
        description="Agrega los datos básicos para registrar un cliente nuevo."
      >
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Nombre
            <input
              type="text"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50"
              placeholder="Ej. Distribuidora La Estrella"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Correo
            <input
              type="email"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50"
              placeholder="cliente@empresa.com"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Teléfono
            <input
              type="tel"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50"
              placeholder="(55) 1234-5678"
            />
          </label>
        </div>
      </Dialog>
    </div>
  );
}
