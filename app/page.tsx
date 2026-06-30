import Image from "next/image";
import type { Customer } from "./generated/prisma/client";
import prisma from "../lib/prisma";

async function getCustomers(): Promise<Customer[]> {
  return prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export default async function Home() {
  const customers = await getCustomers();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-4xl flex-col gap-8 rounded-3xl bg-white p-12 shadow-xl dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            Customers
          </h1>
        </div>

        <section className="space-y-4">
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            This page loads customers from Prisma using the `Customer` model.
          </p>

          {customers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
              No customers found yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {customers.map((customer: Customer) => (
                <article
                  key={customer.id}
                  className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                    {customer.name}
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {customer.email}
                  </p>
                  <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
                    {customer.phone || "No phone provided"}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                    Created {customer.createdAt.toISOString().slice(0, 10)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
