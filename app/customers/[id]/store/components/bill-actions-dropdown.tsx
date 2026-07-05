"use client";

import * as React from "react";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

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

export function BillActionsDropdown({ bill }: { bill: Bill }) {
  const router = useRouter();
  const [openHistory, setOpenHistory] = React.useState(false);
  const [openPayment, setOpenPayment] = React.useState(false);
  const [amount, setAmount] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
      setOpenPayment(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  const history = bill.paidHistory ?? [];
  const remaining = Math.max(0, bill.total - bill.paidAmount);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>}>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenHistory(true)}>
            Ver historial
          </DropdownMenuItem>
          {bill.status !== "paid" && (
            <DropdownMenuItem onClick={() => setOpenPayment(true)}>
              Realizar pago
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de Historial */}
      <Dialog open={openHistory} onOpenChange={setOpenHistory}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Historial de pagos - Factura #{bill.id}</DialogTitle>
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

      {/* Dialog de Pago */}
      <Dialog open={openPayment} onOpenChange={setOpenPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Realizar pago - Factura #{bill.id}</DialogTitle>
            <DialogDescription>
              Total: {new Intl.NumberFormat("es-CR", {
                style: "currency",
                currency: "CRC",
                minimumFractionDigits: 0,
              }).format(bill.total)} | Pendiente: {new Intl.NumberFormat("es-CR", {
                style: "currency",
                currency: "CRC",
                minimumFractionDigits: 0,
              }).format(remaining)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Monto a pagar
              </label>
              <Input
                id="amount"
                type="number"
                min={1}
                max={remaining}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Ingrese el monto"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setOpenPayment(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                variant="secondary"
                onClick={() => handlePayment("partial")}
                disabled={saving || amount <= 0}
              >
                Pago parcial
              </Button>
              <Button
                variant="destructive"
                onClick={() => handlePayment("full")}
                disabled={saving}
              >
                Pago completo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
