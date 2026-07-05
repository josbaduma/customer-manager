"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  name: string;
  quantity: number;
  description: string;
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
        quantity: 1,
        description: "",
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
      quantity: 1,
      description: "",
      unitPrice: 0,
    },
  ]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const total = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

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
          quantity: it.quantity,
          description: it.description || null,
          price: it.unitPrice,
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
          <div key={it.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Ítem #{items.indexOf(it) + 1}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeItem(it.id)}
              >
                Eliminar
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
              <div className="space-y-1">
                <Label htmlFor={`description-${it.id}`}>Descripción</Label>
                <Input
                  id={`description-${it.id}`}
                  placeholder="Descripción (color / diseño)"
                  value={it.description}
                  onChange={(e) =>
                    updateItem(it.id, { description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`quantity-${it.id}`}>Unidades</Label>
                <Input
                  id={`quantity-${it.id}`}
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) =>
                    updateItem(it.id, { quantity: Number(e.target.value) })
                  }
                  placeholder="Unidades"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`unitPrice-${it.id}`}>Precio unit.</Label>
                <Input
                  id={`unitPrice-${it.id}`}
                  type="number"
                  min={0}
                  value={it.unitPrice}
                  onChange={(e) =>
                    updateItem(it.id, { unitPrice: Number(e.target.value) })
                  }
                  placeholder="Precio unit."
                />
              </div>

              <div className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                <div>Total</div>
                <div>{formatCurrency(it.quantity * it.unitPrice)}</div>
              </div>
            </div>
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
