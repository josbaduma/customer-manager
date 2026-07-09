"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Customer = {
  id: number;
  name: string;
  email: string;
  stores: Store[];
};

type Store = {
  id: number;
  name: string;
  location: string;
};

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  store_id: number;
};

type InvoiceItem = {
  id: string;
  productId?: number;
  productName: string;
  productSearch: string;
  description: string;
  quantity: number;
  price: number;
  options: Product[];
  showOptions: boolean;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function InvoicesPage() {
  const nextItemId = React.useRef(1);
  const searchTimer = React.useRef<Record<string, number>>({});

  const createItem = React.useCallback(
    (overrides: Partial<InvoiceItem> = {}): InvoiceItem => {
      const id = `item-${nextItemId.current++}`;
      return {
        id,
        productName: "",
        productSearch: "",
        productId: undefined,
        description: "",
        quantity: 1,
        price: 0,
        options: [],
        showOptions: false,
        ...overrides,
      };
    },
    [],
  );

  const [customerQuery, setCustomerQuery] = React.useState("");
  const [customerOptions, setCustomerOptions] = React.useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [showCustomerOptions, setShowCustomerOptions] = React.useState(false);

  const [storeQuery, setStoreQuery] = React.useState("");
  const [selectedStore, setSelectedStore] = React.useState<Store | null>(null);
  const [showStoreOptions, setShowStoreOptions] = React.useState(false);

  const [items, setItems] = React.useState<InvoiceItem[]>([createItem()]);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (!customerQuery.trim()) {
        setCustomerOptions([]);
        return;
      }

      fetch(`/api/customers?search=${encodeURIComponent(customerQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          setCustomerOptions(data.customers ?? []);
        })
        .catch(() => setCustomerOptions([]));
    }, 250);

    return () => clearTimeout(timeout);
  }, [customerQuery]);

  const storeOptions = React.useMemo(() => {
    if (!selectedCustomer) return [];
    return selectedCustomer.stores.filter((store) =>
      store.location.toLowerCase().includes(storeQuery.toLowerCase()) ||
      store.name.toLowerCase().includes(storeQuery.toLowerCase()),
    );
  }, [selectedCustomer, storeQuery]);

  const total = React.useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [items],
  );

  const updateItem = (id: string, patch: Partial<InvoiceItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, createItem()]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.name);
    setShowCustomerOptions(false);
    setSelectedStore(null);
    setStoreQuery("");
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        productId: undefined,
        productName: "",
        productSearch: "",
        description: "",
        price: 0,
        options: [],
        showOptions: false,
      })),
    );
  };

  const selectStore = (store: Store) => {
    setSelectedStore(store);
    setStoreQuery(store.location);
    setShowStoreOptions(false);
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        productId: undefined,
        productName: "",
        productSearch: "",
        description: "",
        price: 0,
        options: [],
        showOptions: false,
      })),
    );
  };

  const fetchProductOptions = React.useCallback(
    async (itemId: string, query: string) => {
      if (!selectedStore || !query.trim()) {
        updateItem(itemId, { options: [] });
        return;
      }

      const res = await fetch(
        `/api/products?storeId=${selectedStore.id}&search=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      updateItem(itemId, { options: data.products ?? [] });
    },
    [selectedStore],
  );

  const handleProductSearch = (itemId: string, value: string) => {
    updateItem(itemId, { productSearch: value, productName: value, productId: undefined, description: "", price: 0, showOptions: true });

    if (searchTimer.current[itemId]) {
      clearTimeout(searchTimer.current[itemId]);
    }

    searchTimer.current[itemId] = window.setTimeout(() => {
      fetchProductOptions(itemId, value);
    }, 250);
  };

  const selectProduct = (itemId: string, product: Product) => {
    updateItem(itemId, {
      productId: product.id,
      productName: product.name,
      productSearch: product.name,
      description: product.description ?? "",
      price: product.price,
      options: [],
      showOptions: false,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!selectedCustomer) {
      setError("Selecciona un cliente válido.");
      return;
    }

    if (!selectedStore) {
      setError("Selecciona una tienda válida.");
      return;
    }

    if (total <= 0) {
      setError("El total debe ser mayor a 0.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          storeId: selectedStore.id,
          total,
          items: items.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "No se pudo generar la factura.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `factura-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage("Factura generada y descargada correctamente.");
    } catch (err) {
      console.error(err);
      setError("No se pudo generar la factura.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          Facturas
        </p>
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-50">
          Generar factura sencilla
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-400">
          Busca cliente y tienda de la base de datos. Selecciona productos existentes con búsqueda en la tienda.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative space-y-1">
                <Label htmlFor="customerName">Cliente</Label>
                <Input
                  id="customerName"
                  value={customerQuery}
                  onFocus={() => setShowCustomerOptions(true)}
                  onChange={(event) => {
                    setCustomerQuery(event.target.value);
                    setSelectedCustomer(null);
                  }}
                  placeholder="Buscar cliente..."
                  autoComplete="off"
                />
                {showCustomerOptions && customerOptions.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-3xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-950">
                    {customerOptions.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectCustomer(customer)}
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{customer.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative space-y-1">
                <Label htmlFor="storeLocation">Tienda</Label>
                <Input
                  id="storeLocation"
                  value={storeQuery}
                  onFocus={() => setShowStoreOptions(true)}
                  onChange={(event) => {
                    setStoreQuery(event.target.value);
                    setSelectedStore(null);
                  }}
                  placeholder={selectedCustomer ? "Buscar tienda..." : "Selecciona cliente primero"}
                  disabled={!selectedCustomer}
                  autoComplete="off"
                />
                {showStoreOptions && selectedCustomer && storeOptions.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-3xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-950">
                    {storeOptions.map((store) => (
                      <button
                        key={store.id}
                        type="button"
                        className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectStore(store)}
                      >
                        <div className="font-medium">{store.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{store.location}</div>
                      </button>
                    ))}
                    {storeOptions.length === 0 && (
                      <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">No hay tiendas para este cliente.</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-4xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total de registros</span>
                <span>{items.length}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-base font-semibold text-slate-950 dark:text-slate-50">
                <span>Total factura</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                Detalle de registros
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Busca productos de la tienda seleccionada. Elige el producto para completar precio y descripción.
              </p>
            </div>

            <Button type="button" variant="secondary" onClick={addItem}>
              Agregar registro
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="rounded-4xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Registro {index + 1}
                  </div>
                  <Button type="button" variant="ghost" onClick={() => removeItem(item.id)}>
                    Eliminar
                  </Button>
                </div>

                <div className="grid gap-4 xl:grid-cols-[2fr_1fr_1fr_auto] xl:items-end">
                  <div className="relative space-y-1">
                    <Label htmlFor={`productName-${item.id}`}>Producto</Label>
                    <Input
                      id={`productName-${item.id}`}
                      value={item.productName}
                      onFocus={() => updateItem(item.id, { showOptions: true })}
                      onChange={(event) => handleProductSearch(item.id, event.target.value)}
                      placeholder={
                        selectedStore ? "Buscar producto..." : "Selecciona tienda primero"
                      }
                      disabled={!selectedStore}
                      autoComplete="off"
                    />
                    {item.showOptions && item.options.length > 0 && (
                      <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-3xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-950">
                        {item.options.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectProduct(item.id, product)}
                          >
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {product.description ?? "Sin descripción"}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`quantity-${item.id}`}>Cantidad</Label>
                    <Input
                      id={`quantity-${item.id}`}
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(item.id, {
                          quantity: Math.max(1, Number(event.target.value) || 1),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`price-${item.id}`}>Precio</Label>
                    <Input
                      id={`price-${item.id}`}
                      type="number"
                      min={0}
                      value={item.price}
                      onChange={(event) =>
                        updateItem(item.id, {
                          price: Math.max(0, Number(event.target.value) || 0),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1 rounded-3xl bg-white p-3 text-sm font-medium text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100">
                    <div>Total</div>
                    <div>{formatCurrency(item.quantity * item.price)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {message ? (
          <div className="rounded-4xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-4xl border border-destructive-200 bg-destructive-50 p-4 text-sm text-destructive-900 dark:border-destructive-800 dark:bg-destructive-950/30 dark:text-destructive-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Total a pagar: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(total)}</span>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Generando..." : "Generar factura"}
          </Button>
        </div>
      </form>
    </div>
  );
}
