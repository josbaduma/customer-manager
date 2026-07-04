"use client";

import { useState } from "react";
import type * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type AccountFormProps = {
  initialEmail: string;
};

export default function AccountForm({ initialEmail }: AccountFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/auth/account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, currentPassword, newPassword }),
    });

    let data: { error?: string; message?: string } = {};
    const text = await response.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error || "No se pudo actualizar la cuenta");
      return;
    }

    setMessage(data.message || "Actualizado correctamente");
    setCurrentPassword("");
    setNewPassword("");
    if (email) {
      setEmail("");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Administrar cuenta</p>
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-50">Actualiza tu correo o contraseña</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cambia tu correo electrónico y/o contraseña de forma segura.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Nuevo correo electrónico
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nuevo@dominio.com"
              className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-slate-500 dark:focus:ring-slate-700"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Contraseña actual
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="********"
              className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-slate-500 dark:focus:ring-slate-700"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Nueva contraseña
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="********"
              className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-slate-500 dark:focus:ring-slate-700"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-green-600">{message}</p> : null}

          <div className="flex items-center justify-between gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Actualizando..." : "Guardar cambios"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => window.location.assign("/")}>Volver</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
