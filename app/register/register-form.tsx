"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/button";

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo crear el usuario");
      return;
    }

    await router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Registrar usuario</p>
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-50">Crea tu cuenta</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Registra un nuevo usuario para acceder al panel de gestión.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Nombre completo
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Juan Pérez"
              className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-slate-500 dark:focus:ring-slate-700"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@dominio.com"
              className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-slate-500 dark:focus:ring-slate-700"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-slate-500 dark:focus:ring-slate-700"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>¿Ya tienes cuenta?</span>
            <a href="/login" className="font-medium text-slate-900 transition hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300">
              Iniciar sesión
            </a>
          </div>

          <Button type="submit" className="w-full">Crear cuenta</Button>
        </form>
      </div>
    </div>
  );
}
