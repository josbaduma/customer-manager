"use client";

import { useState } from "react";
import type { Product } from "@/app/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/helpers";

type ProductWithQuantity = Product & {
  quantity: number | null;
  paidHistory?: Array<{ amountPaid: number }>;
};

type StoreRow = {
  id: number;
  name: string;
  location: string;
  products: ProductWithQuantity[];
};

type EditableProduct = {
  id: number;
  name: string;
  quantity: number;
  total: number;
  pending: number;
  paidTotal: number;
  price: number;
};

interface EditableProductsTableProps {
  stores: StoreRow[];
}

function getPendingAmount(product: ProductWithQuantity) {
  const quantity = product.quantity ?? 0;
  const total = product.price * quantity;
  const paidTotal = (product.paidHistory ?? []).reduce(
    (sum, entry) => sum + (entry.amountPaid ?? 0),
    0,
  );

  return Math.max(0, total - paidTotal);
}

function toEditableProduct(product: ProductWithQuantity): EditableProduct {
  const quantity = product.quantity ?? 0;
  const total = product.price * quantity;
  const paidTotal = (product.paidHistory ?? []).reduce(
    (sum, entry) => sum + (entry.amountPaid ?? 0),
    0,
  );

  return {
    id: product.id,
    name: product.name,
    quantity,
    total,
    pending: Math.max(0, total - paidTotal),
    paidTotal,
    price: product.price,
  };
}

export function EditableProductsTable({ stores }: EditableProductsTableProps) {
  const [storeRows, setStoreRows] = useState(() =>
    stores.map((store) => ({
      ...store,
      products: store.products.map(toEditableProduct),
    })),
  );

  const [newProductInputs, setNewProductInputs] = useState(
    () =>
      Object.fromEntries(
        stores.map((store) => [store.id, { name: "", quantity: 0, price: 0 }]),
      ) as Record<number, { name: string; quantity: number; price: number }>,
  );

  const [savingProductIds, setSavingProductIds] = useState<
    Record<number, boolean>
  >({});
  const [addingStoreIds, setAddingStoreIds] = useState<Record<number, boolean>>(
    {},
  );
  const [productPayments, setProductPayments] = useState<Record<number, number>>({});

  function updateProduct(
    storeId: number,
    productId: number,
    patch: Partial<EditableProduct>,
  ) {
    setStoreRows((prev) =>
      prev.map((store) => {
        if (store.id !== storeId) {
          return store;
        }

        return {
          ...store,
          products: store.products.map((product) => {
            if (product.id !== productId) {
              return product;
            }

            return {
              ...product,
              ...patch,
            };
          }),
        };
      }),
    );
  }

  async function addNewProduct(storeId: number) {
    const newInput = newProductInputs[storeId];

    if (!newInput.name || newInput.price < 0 || newInput.quantity < 0) {
      return;
    }

    setAddingStoreIds((prev) => ({ ...prev, [storeId]: true }));

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          name: newInput.name,
          quantity: newInput.quantity,
          price: newInput.price,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error(result.error ?? "No se pudo crear el producto.");
        return;
      }

      const createdProduct = result.product as ProductWithQuantity;
      const editableProduct = toEditableProduct(createdProduct);
      const pendingFromServer = (result.pending as number) ?? editableProduct.pending;
      const paidTotalFromServer = (result.paidTotal as number) ?? editableProduct.paidTotal;
      editableProduct.pending = pendingFromServer;
      editableProduct.paidTotal = paidTotalFromServer;

      setStoreRows((prev) =>
        prev.map((store) =>
          store.id !== storeId
            ? store
            : { ...store, products: [...store.products, editableProduct] },
        ),
      );

      setNewProductInputs((prev) => ({
        ...prev,
        [storeId]: { name: "", quantity: 0, price: 0 },
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setAddingStoreIds((prev) => ({ ...prev, [storeId]: false }));
    }
  }

  function updateNewProductInput(
    storeId: number,
    field: "name" | "quantity" | "price",
    value: string | number,
  ) {
    setNewProductInputs((prev) => ({
      ...prev,
      [storeId]: {
        ...prev[storeId],
        [field]: value,
      },
    }));
  }

  async function saveProduct(storeId: number, product: EditableProduct) {
    setSavingProductIds((prev) => ({ ...prev, [product.id]: true }));

    try {
      const paymentAmount = productPayments[product.id];

      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          quantity: product.quantity,
          price: product.price,
          ...(typeof paymentAmount === "number" && paymentAmount > 0 ? { paymentAmount } : {}),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error(result.error ?? "No se pudo actualizar el producto.");
        return;
      }

      const updatedProduct = result.product as ProductWithQuantity;
      const pendingFromServer =
        (result.pending as number) ?? getPendingAmount(updatedProduct);
      const paidTotalFromServer = (result.paidTotal as number) ?? 0;

      updateProduct(storeId, product.id, {
        ...toEditableProduct(updatedProduct),
        pending: pendingFromServer,
        paidTotal: paidTotalFromServer,
      });

      // clear payment input for this product
      setProductPayments((prev) => ({ ...prev, [product.id]: 0 }));
    } catch (error) {
      console.error(error);
    } finally {
      setSavingProductIds((prev) => ({ ...prev, [product.id]: false }));
    }
  }

  return (
    <div className="space-y-8">
      {storeRows.map((store, index) => (
        <div key={store.id} className="mb-8">
          {index > 0 ? <Separator className="my-8" /> : null}
          <div className="mb-4 text-md text-slate-500 dark:text-slate-400">
            <p>{store.name}</p>
          </div>
          <Table className="min-w-full table-auto sm:table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/10">#</TableHead>
                <TableHead className="w-3/10">Nombre</TableHead>
                <TableHead className="w-1/10">Unidades</TableHead>
                <TableHead className="w-1/10">Precio</TableHead>
                <TableHead className="w-1/10">Total</TableHead>
                <TableHead className="w-1/10">Pendiente</TableHead>
                <TableHead className="w-1/10">Abono</TableHead>
                <TableHead className="w-1/10">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Input
                      value={`#${product.id}`}
                      readOnly
                      className="bg-transparent px-0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={product.name}
                      onChange={(event) =>
                        updateProduct(store.id, product.id, {
                          name: event.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={product.quantity}
                      onChange={(event) => {
                        const nextQuantity = Number(event.target.value);
                        const safeQuantity = Number.isNaN(nextQuantity)
                          ? 0
                          : nextQuantity;

                        updateProduct(store.id, product.id, {
                          quantity: safeQuantity,
                          total: product.price * safeQuantity,
                          pending: Math.max(0, product.price * safeQuantity - product.paidTotal),
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={product.price}
                      onChange={(event) => {
                        const nextPrice = Number(event.target.value);
                        const safePrice = Number.isNaN(nextPrice)
                          ? 0
                          : nextPrice;
                        const nextTotal = safePrice * product.quantity;

                        updateProduct(store.id, product.id, {
                          price: safePrice,
                          total: nextTotal,
                          pending: Math.max(0, nextTotal - product.paidTotal),
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {formatCurrency(product.price * product.quantity)}
                  </TableCell>
                  <TableCell>{formatCurrency(product.pending)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={productPayments[product.id] ?? 0}
                      onChange={(event) =>
                        setProductPayments((prev) => ({
                          ...prev,
                          [product.id]: Number(event.target.value),
                        }))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => saveProduct(store.id, product)}
                        disabled={savingProductIds[product.id]}
                      >
                        {savingProductIds[product.id]
                          ? "Guardando..."
                          : "Guardar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-bold">TOTAL</TableCell>
                <TableCell>-</TableCell>
                <TableCell className="font-bold">
                  {store.products.reduce(
                    (sum, product) => sum + product.quantity,
                    0,
                  )}
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell className="font-bold">
                  {formatCurrency(
                    store.products.reduce(
                      (sum, product) => sum + product.total,
                      0,
                    ),
                  )}
                </TableCell>
                <TableCell className="font-bold">
                  {formatCurrency(
                    store.products.reduce(
                      (sum, product) => sum + product.pending,
                      0,
                    ),
                  )}
                </TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Input
                    value="Nuevo"
                    readOnly
                    className="bg-transparent px-0 text-slate-400"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Nombre"
                    value={newProductInputs[store.id]?.name ?? ""}
                    onChange={(event) =>
                      updateNewProductInput(
                        store.id,
                        "name",
                        event.target.value,
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    value={newProductInputs[store.id]?.quantity ?? 0}
                    onChange={(event) =>
                      updateNewProductInput(
                        store.id,
                        "quantity",
                        Number(event.target.value),
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    value={newProductInputs[store.id]?.price ?? 0}
                    onChange={(event) =>
                      updateNewProductInput(
                        store.id,
                        "price",
                        Number(event.target.value),
                      )
                    }
                  />
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => addNewProduct(store.id)}
                      disabled={addingStoreIds[store.id]}
                    >
                      {addingStoreIds[store.id] ? "Agregando..." : "Agregar"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
