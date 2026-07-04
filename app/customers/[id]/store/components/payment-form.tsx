"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

type Bill = {
  id: number;
  total: number;
  paidAmount: number;
  status: "pending" | "partial" | "paid";
};

export function PaymentForm({ bill }: { bill: Bill }) {
  const router = useRouter();
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
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {bill.status !== "paid" ? (
        <>
          <div className="flex items-center gap-2">
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
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </>
      ) : (
        <p className="text-sm font-medium text-emerald-700">Factura pagada</p>
      )}
    </div>
  );
}
