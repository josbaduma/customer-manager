"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export function NewBillForm({ storeId }: { storeId: number }) {
  const router = useRouter();
  const [amount, setAmount] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError("El total debe ser mayor a 0.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, total: amount }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear la factura.");
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
    <form className="flex flex-wrap gap-2" onSubmit={handleSubmit}>
      <Label className="sr-only">Total factura</Label>
      <Input
        type="number"
        min={1}
        value={amount}
        onChange={(event) => setAmount(Number(event.target.value))}
        placeholder="Total factura"
        className="w-32"
      />
      <Button type="submit" disabled={saving}>
        {saving ? "Creando..." : "Nueva factura"}
      </Button>
      {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
