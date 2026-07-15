"use client";

import type { Bill, Customer, Product } from "@/app/generated/prisma/client";
import StoreForm from "@/app/customers/components/store-form";
import { useParams } from "next/navigation";
import { EditableProductsTable } from "./editable-products-table";
import React from "react";

type CustomerWithRelations = Customer & {
  stores: Array<{
    id: number;
    name: string;
    location: string;
    products: Array<Product & { paidHistory: Array<{ amountPaid: number }> }>;
    bills: Array<
      Bill & {
        paidHistory: Array<{
          id: number;
          amountPaid: number;
          createdAt: Date | string;
        }>;
      }
    >;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function CustomerPage() {
  const params = useParams<{ id?: string }>();
  const id = params.id;
  const [customer, setCustomer] = React.useState<CustomerWithRelations | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState(true);

  const loadCustomer = React.useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/customers/${id}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("No se pudieron cargar los clientes.");
      }

      const data = await response.json();
      setCustomer(data.customer as CustomerWithRelations);
    } catch {
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void loadCustomer();
  }, [loadCustomer]);

  if (!id) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <div className="mx-auto w-full max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
          <h1 className="text-3xl font-semibold">Cliente no encontrado</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            No hay ningún cliente activo disponible en este momento.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Cargando cliente...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <div className="mx-auto w-full max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
          <h1 className="text-3xl font-semibold">Cliente no encontrado</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            No hay ningún cliente activo disponible en este momento.
          </p>
        </div>
      </div>
    );
  }

  const stores = customer.stores ?? [];

  const totalPendiente = stores.reduce((sum, store) => {
    const storePending = (store.products ?? []).reduce((productSum, product) => {
      const total = product.price * (product.quantity ?? 0);
      const paidTotal = (product.paidHistory ?? []).reduce(
        (historySum, entry) => historySum + (entry.amountPaid ?? 0),
        0,
      );

      return productSum + Math.max(0, total - paidTotal);
    }, 0);

    return sum + storePending;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                <span>Clientes</span>
                <span>›</span>
                <span className="text-slate-900 dark:text-slate-100">
                  {customer.name}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xl font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                  {(customer.name ?? "")
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("") || "C"}
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                    {customer.name ?? "Cliente"}
                  </h1>
                </div>
              </div>
              <div>
                <p className="text-md text-slate-500 dark:text-slate-400">
                  Pendiente de cobro:{" "}
                  <span className="font-semibold text-amber-900 dark:text-amber-200">
                    {formatCurrency(totalPendiente)}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StoreForm
                customerId={customer.id}
                onStoreChanged={loadCustomer}
              />
            </div>
          </div>
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
          <EditableProductsTable
            stores={stores.map((store) => ({
              id: store.id,
              name: store.name,
              location: store.location,
              products: store.products,
            }))}
          />
        </section>
        {/* <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Tiendas asociadas
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                {stores.length} tiendas
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost">Filtrar</Button>
              <Button variant="outline">Exportar</Button>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid gap-4 xl:grid-cols-2">
            {storesWithStats.map((store) => (
              <Card
                key={store.id}
                className="rounded-[2rem] border border-slate-200 bg-slate-50 shadow-none dark:border-slate-800 dark:bg-slate-900"
              >
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          <ArrowRight className="size-4" />
                        </span>
                        {store.name}
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {store.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/customers/${customer.id}/store/${store.id}`}
                        className="inline-flex rounded-full border border-transparent bg-slate-100 px-3 py-2 text-sm font-medium text-primary transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
                      >
                        Ver tienda
                      </Link>
                      <StoreForm
                        customerId={customer.id}
                        store={{
                          id: store.id,
                          name: store.name,
                          location: store.location,
                        }}
                        triggerLabel="Editar"
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <div className="text-sm uppercase tracking-[0.2em] text-slate-500">
                        Camisetas
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                        {store.camisetas}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm uppercase tracking-[0.2em] text-slate-500">
                        Cobrado
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-emerald-800 dark:text-emerald-200">
                        {formatCurrency(store.cobrado)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm uppercase tracking-[0.2em] text-slate-500">
                        Pendiente
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-amber-800 dark:text-amber-200">
                        {formatCurrency(store.pendiente)}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                    {store.pagas} pagas
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900">
                    {store.parciales} parciales
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                    {store.pendientes} pendientes
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section> */}
      </div>
    </div>
  );
}
