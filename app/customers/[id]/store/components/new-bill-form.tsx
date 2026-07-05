"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  name: string;
  description: string;
  units: number;
  unitPrice: number;
};

export function NewBillForm({ storeId }: { storeId: number }) {
  const router = useRouter();
  const nextId = React.useRef(1);
  const createItem = React.useCallback(
    (overrides: Partial<Item> = {}): Item => {
      const id = `item-${nextId.current++}`;
      return {
        id,
        name: "",
        description: "",
        units: 1,
        unitPrice: 0,
        ...overrides,
      };
    },
    [],
  );
  const [items, setItems] = React.useState<Item[]>([
    {
      id: "item-0",
      name: "",
      description: "",
      units: 1,
      unitPrice: 0,
    },
  ]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const total = items.reduce((sum, it) => sum + it.units * it.unitPrice, 0);

  const updateItem = (id: string, patch: Partial<Item>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, createItem()]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (total <= 0) {
      setError("El total debe ser mayor a 0.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        storeId,
        total,
        products: items.map((it) => ({
          name: it.name || `Item`,
          description: it.description || null,
          price: it.unitPrice,
          units: it.units,
        })),
      };

      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear la factura.");
        return;
      }

      setItems([createItem()]);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      minimumFractionDigits: 0,
    }).format(value);
  }

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex flex-wrap items-center gap-2">
            <Label className="sr-only">Descripción</Label>
            <Input
              placeholder="Descripción (color / diseño)"
              value={it.description}
              onChange={(e) =>
                updateItem(it.id, { description: e.target.value })
              }
              className="flex-1 min-w-[160px]"
            />
            <Input
              type="number"
              min={1}
              value={it.units}
              onChange={(e) =>
                updateItem(it.id, { units: Number(e.target.value) })
              }
              className="w-24"
              placeholder="Unidades"
            />
            <Input
              type="number"
              min={0}
              value={it.unitPrice}
              onChange={(e) =>
                updateItem(it.id, { unitPrice: Number(e.target.value) })
              }
              className="w-28"
              placeholder="Precio unit."
            />
            <div className="w-32 text-sm">
              Total: {formatCurrency(it.units * it.unitPrice)}
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => removeItem(it.id)}
            >
              Eliminar
            </Button>
          </div>
        ))}

        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={addItem}>
            Agregar ítem
          </Button>
          <div className="ml-auto font-semibold">
            Total factura: {formatCurrency(total)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Creando..." : "Crear factura"}
          </Button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
    </form>
  );
}
