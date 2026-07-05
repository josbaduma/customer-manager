"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Bill = {
  id: number;
  total: number;
  paidAmount: number;
  status: "pending" | "partial" | "paid";
  paidHistory?: Array<{
    id: number;
    amountPaid: number;
    createdAt: Date | string;
  }>;
};

export function PaymentForm({ bill }: { bill: Bill }) {
  const router = useRouter();
  const [amount, setAmount] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [openHistory, setOpenHistory] = React.useState(false);

  const handlePayment = async (action: "full" | "partial") => {
    setSaving(true);
    setError(null);

    try {
      const payload = action === "partial" ? { paymentAmount: amount, action } : { action };
      const res = await fetch(`/api/bills/${bill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo procesar el pago.");
        return;
      }

      setAmount(0);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  const history = bill.paidHistory ?? [];

  return (
    <div className="flex flex-col gap-2">
      {bill.status !== "paid" ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              placeholder="Pago parcial"
              className="w-24"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePayment("partial")}
              disabled={saving || amount <= 0}
            >
              Pago parcial
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handlePayment("full")}
              disabled={saving}
            >
              Pago completo
            </Button>
            <Dialog open={openHistory} onOpenChange={setOpenHistory}>
              <DialogTrigger
                render={<Button variant="outline" size="sm">Historial</Button>}
              />
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Historial de pagos</DialogTitle>
                  <DialogDescription>
                    Registro de los pagos aplicados a esta factura.
                  </DialogDescription>
                </DialogHeader>
                {history.length > 0 ? (
                  <div className="max-h-80 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {new Date(item.createdAt).toLocaleString("es-CR", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {new Intl.NumberFormat("es-CR", {
                                style: "currency",
                                currency: "CRC",
                                minimumFractionDigits: 0,
                              }).format(item.amountPaid)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Aún no hay pagos registrados para esta factura.
                  </p>
                )}
              </DialogContent>
            </Dialog>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-emerald-700">Factura pagada</p>
          <Dialog open={openHistory} onOpenChange={setOpenHistory}>
            <DialogTrigger
              render={<Button variant="outline" size="sm">Historial</Button>}
            />
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Historial de pagos</DialogTitle>
                <DialogDescription>
                  Registro de los pagos aplicados a esta factura.
                </DialogDescription>
              </DialogHeader>
              {history.length > 0 ? (
                <div className="max-h-80 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {new Date(item.createdAt).toLocaleString("es-CR", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {new Intl.NumberFormat("es-CR", {
                              style: "currency",
                              currency: "CRC",
                              minimumFractionDigits: 0,
                            }).format(item.amountPaid)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Aún no hay pagos registrados para esta factura.
                </p>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
