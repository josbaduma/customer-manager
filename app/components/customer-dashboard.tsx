"use client";

import * as React from "react";
import type { Customer } from "../generated/prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";

export type CustomerWithRelations = Customer & {
  deletedAt?: Date | null;
  stores: Array<{
    id: number;
    name: string;
    location: string;
    bills: Array<{
      id: number;
      total: number;
    }>;
    products: Array<{
      id: number;
      name: string;
      quantity: number | null;
      price: number;
      paidHistory: Array<{ amountPaid: number }>;
    }>;
  }>;
};

type CustomerForm = {
  id?: number;
  name: string;
  email: string;
  phone: string;
};

function getInitialFormData(customer?: CustomerWithRelations): CustomerForm {
  return {
    id: customer?.id,
    name: customer?.name ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
  }).format(value);
}

interface CustomerDashboardProps {
  customers: CustomerWithRelations[];
}

export function CustomerDashboard({ customers }: CustomerDashboardProps) {
  const [customerList, setCustomerList] =
    React.useState<CustomerWithRelations[]>(customers);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">(
    "create",
  );
  const [formData, setFormData] =
    React.useState<CustomerForm>(getInitialFormData());
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 5;
  const router = useRouter();

  const openCreateDialog = () => {
    setDialogMode("create");
    setFormData(getInitialFormData());
    setError(null);
    setOpenDialog(true);
  };

  const openEditDialog = (customer: CustomerWithRelations) => {
    setDialogMode("edit");
    setFormData(getInitialFormData(customer));
    setError(null);
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setFormData(getInitialFormData());
    setError(null);
  };

  const handleInputChange = (field: keyof CustomerForm, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSaveCustomer = async () => {
    if (!formData.name || !formData.email) {
      setError("Nombre y correo son requeridos.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(
        dialogMode === "create"
          ? "/api/customers"
          : `/api/customers/${formData.id}`,
        {
          method: dialogMode === "create" ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Error al guardar el cliente.");
        return;
      }

      const updatedCustomer: CustomerWithRelations = data.customer;

      if (dialogMode === "create") {
        setCustomerList((current) => [updatedCustomer, ...current]);
      } else {
        setCustomerList((current) =>
          current.map((customer) =>
            customer.id === updatedCustomer.id ? updatedCustomer : customer,
          ),
        );
      }

      closeDialog();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = async (customer: CustomerWithRelations) => {
    if (!window.confirm(`¿Eliminar al cliente ${customer.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Error al eliminar el cliente.");
        return;
      }

      setCustomerList((current) =>
        current.filter((item) => item.id !== customer.id),
      );
    } catch {
      setError("No se pudo conectar con el servidor.");
    }
  };

  const customersWithTotals = customerList.map((customer) => {
    const pendiente = customer.stores.reduce((storeSum, store) => {
      const storePending = store.products.reduce((productSum, product) => {
        const total = product.price * (product.quantity ?? 0);
        const paidTotal = (product.paidHistory ?? []).reduce(
          (historySum, entry) => historySum + (entry.amountPaid ?? 0),
          0,
        );

        return productSum + Math.max(0, total - paidTotal);
      }, 0);

      return storeSum + storePending;
    }, 0);

    return {
      customer,
      pendiente,
      tiendas: customer.stores.length,
    };
  });

  const totalPendiente = customersWithTotals.reduce(
    (sum, item) => sum + item.pendiente,
    0,
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <main className="mx-auto w-full max-w-6xl space-y-8 pb-10">
        <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white px-8 py-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Clientes</h1>
          </div>

          <div className="space-y-2">
            <p className="text-md font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-400">
              Total pendiente por cobrar
            </p>
            <p className="text-lg font-semibold tracking-tight text-amber-900 dark:text-amber-200">
              {formatCurrency(totalPendiente)}
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">
                Listado de clientes
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Detalles de facturación y tiendas por cliente.
              </p>
            </div>
            <Button onClick={openCreateDialog}>Nuevo cliente</Button>
          </div>

          <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total Pendiente</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const start = (currentPage - 1) * pageSize;
                  const end = start + pageSize;
                  return customersWithTotals
                    .slice(start, end)
                    .map(({ customer, pendiente }) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <div className="font-semibold">{customer.name}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-amber-800 dark:text-amber-300">
                          {formatCurrency(pendiente)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              onClick={() =>
                                router.push(`/customers/${customer.id}`)
                              }
                            >
                              Ver
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => openEditDialog(customer)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="secondary"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-950"
                              onClick={() => handleDeleteCustomer(customer)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ));
                })()}
              </TableBody>
            </Table>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <div>
                Mostrando{" "}
                {Math.min(
                  customersWithTotals.length,
                  (currentPage - 1) * pageSize + 1,
                )}{" "}
                - {Math.min(customersWithTotals.length, currentPage * pageSize)}{" "}
                de {customersWithTotals.length} clientes
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({
                    length: Math.max(
                      1,
                      Math.ceil(customersWithTotals.length / pageSize),
                    ),
                  }).map((_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? undefined : "secondary"}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="secondary"
                  disabled={
                    currentPage >=
                    Math.ceil(customersWithTotals.length / pageSize)
                  }
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={openDialog} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Nuevo cliente" : "Editar cliente"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? "Agrega los datos básicos para registrar un cliente nuevo."
                : "Actualiza los datos del cliente."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
                {error}
              </div>
            ) : null}

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nombre
              <input
                type="text"
                value={formData.name}
                onChange={(event) =>
                  handleInputChange("name", event.target.value)
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50"
                placeholder="Ej. Distribuidora La Estrella"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Correo
              <input
                type="email"
                value={formData.email}
                onChange={(event) =>
                  handleInputChange("email", event.target.value)
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50"
                placeholder="cliente@empresa.com"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Teléfono
              <input
                type="tel"
                value={formData.phone}
                onChange={(event) =>
                  handleInputChange("phone", event.target.value)
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50"
                placeholder="(55) 1234-5678"
              />
            </label>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={handleSaveCustomer} disabled={isSaving}>
                {isSaving
                  ? "Guardando..."
                  : dialogMode === "create"
                    ? "Crear cliente"
                    : "Guardar cambios"}
              </Button>
              <Button
                variant="secondary"
                onClick={closeDialog}
                className="text-slate-900 dark:text-slate-100"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
