import type { Bill, Customer, Store } from "@/app/generated/prisma/client";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { NewBillForm } from "../components/new-bill-form";
import { BillActionsDropdown } from "../components/bill-actions-dropdown";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface StoreWithRelations extends Store {
  customer: Customer;
  bills: Array<
    Bill & {
      products: Array<{ id: number; quantity: number | null }>;
      paidHistory: Array<{
        id: number;
        amountPaid: number;
        createdAt: Date | string;
      }>;
    }
  >;
}

async function getStore(
  customerId: number,
  storeId: number,
): Promise<StoreWithRelations | null> {
  return prisma.store.findFirst({
    where: { id: storeId, customer_id: customerId, deletedAt: null },
    include: {
      customer: true,
      bills: {
        include: {
          products: true,
          paidHistory: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
}

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string; storeId: string }>;
}) {
  const { id, storeId } = await params;
  const customerId = parseInt(id, 10);
  const storeIdNum = parseInt(storeId, 10);

  if (Number.isNaN(customerId) || Number.isNaN(storeIdNum)) {
    notFound();
  }

  const store = await getStore(customerId, storeIdNum);
  if (!store) {
    notFound();
  }

  const totalCobrado = store.bills.reduce(
    (sum, bill) => sum + bill.paidAmount,
    0,
  );
  const totalPending = store.bills.reduce(
    (sum, bill) => sum + (bill.total - bill.paidAmount),
    0,
  );
  const pendingCount = store.bills.filter(
    (bill) => bill.status !== "paid",
  ).length;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
  }).format(value);
}

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Tienda
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-50">
                {store.name}
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {store.location}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Card className="rounded-[2rem] border border-slate-200 bg-slate-50 shadow-none dark:border-slate-800 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.18em] text-slate-500">
                  Total cobrado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-emerald-900 dark:text-emerald-200">
                  {formatCurrency(totalCobrado)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border border-slate-200 bg-amber-50 shadow-none dark:border-slate-800 dark:bg-slate-950">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.18em] text-amber-700">
                  Pendiente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-amber-900 dark:text-amber-200">
                  {formatCurrency(totalPending)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border border-slate-200 bg-slate-50 shadow-none dark:border-slate-800 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.18em] text-slate-500">
                  Facturas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-slate-950 dark:text-slate-50">
                  {store.bills.length}
                </p>
                <CardDescription>{pendingCount} pendientes</CardDescription>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-8" />

          <div>
            <div className="space-y-12">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">
                      Facturas
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Pagos pendientes, parciales y completos.
                    </p>
                  </div>
                  <NewBillForm storeId={store.id} />
                </div>

                <div className="mt-6">
                  <Table>
                    <TableHeader>
                      <tr>
                        <TableHead>#</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Unidades</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Cobrado</TableHead>
                        <TableHead>Pendiente</TableHead>
                        <TableHead>Progreso</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {store.bills.map((bill) => {
                        const units = bill.products.reduce(
                          (sum, product) => sum + (product.quantity ?? 0),
                          0,
                        );
                        const remaining = Math.max(0, bill.total - bill.paidAmount);
                        const progress = bill.total > 0 ? Math.min(100, Math.round((bill.paidAmount / bill.total) * 100)) : 0;
                        const statusLabel =
                          bill.status === "paid"
                            ? "Pagada"
                            : bill.status === "partial"
                              ? "Parcial"
                              : "Pendiente";
                        return (
                          <TableRow key={bill.id}>
                            <TableCell>
                              <div className="text-sm font-semibold">#{bill.id}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-slate-500">{bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : "-"}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{units}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-semibold">{formatCurrency(bill.total)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-emerald-700">{formatCurrency(bill.paidAmount)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-amber-700">{formatCurrency(remaining)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="w-40">
                                <div className="h-2 w-full rounded-full bg-slate-200">
                                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{progress}%</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm capitalize">{statusLabel}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <BillActionsDropdown bill={bill} />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

{/*             <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">
                  Resumen de tienda
                </h2>
                <div className="mt-6 space-y-4 text-sm text-slate-500 dark:text-slate-400">
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      Cliente:
                    </span>{" "}
                    {store.customer.name}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      Ubicación:
                    </span>{" "}
                    {store.location}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      Facturas totales:
                    </span>{" "}
                    {store.bills.length}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      Pendiente total:
                    </span>{" "}
                    ${totalPending.toFixed(0)}
                  </p>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
