"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

type Store = {
  id: number;
  name: string;
  location: string;
};

export default function StoreForm({
  customerId,
  store,
  triggerLabel,
}: {
  customerId: number;
  store?: Store;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(store?.name ?? "");
  const [location, setLocation] = React.useState(store?.location ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setName(store?.name ?? "");
      setLocation(store?.location ?? "");
      setError(null);
    }

    setOpen(nextOpen);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const payload = { name, location, customerId };

      const res = await fetch(
        store ? `/api/stores/${store.id}` : "/api/stores",
        {
          method: store ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(store ? { name, location } : payload),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al guardar la tienda");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!store) return;
    if (!confirm(`¿Eliminar la tienda ${store.name}?`)) return;

    try {
      const res = await fetch(`/api/stores/${store.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al eliminar la tienda");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {error ? (
          <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}
        <DialogTrigger
          render={
            <Button variant="outline" size="sm">
              {triggerLabel ?? (store ? "Editar" : "Nueva tienda")}
            </Button>
          }
        ></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {store ? "Editar tienda" : "Nueva tienda"}
            </DialogTitle>
            <DialogDescription>
              {store
                ? "Actualiza los datos de la tienda."
                : "Agrega una nueva tienda para este cliente."}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Nombre</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Sucursal Centro"
            />
          </div>
          <div>
            <Label className="mt-2">Ubicación</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Dirección o ciudad"
            />
          </div>

          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? "Guardando..."
                : store
                  ? "Guardar cambios"
                  : "Crear tienda"}
            </Button>
            <DialogClose
              render={<Button variant="secondary">Cancelar</Button>}
            ></DialogClose>
            {store ? (
              <Button type="submit" variant="destructive" className="ml-auto">
                Eliminar
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
