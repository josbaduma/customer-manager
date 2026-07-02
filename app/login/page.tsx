"use client";

import { useState } from "react";
import { Button } from "../components/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Iniciar sesión</p>
          <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-50">Bienvenido de vuelta</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ingresa tus datos para acceder al panel de gestión.
          </p>
        </div>

        <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
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

          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500" />
              <span>Recordarme</span>
            </label>
            <a href="#" className="font-medium text-slate-900 transition hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300">
              Olvidé mi contraseña
            </a>
          </div>

          <Button type="submit" className="w-full">Entrar</Button>
        </form>
      </div>
    </div>
  );
}
