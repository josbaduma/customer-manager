import type { Customer } from "./generated/prisma/client";
import prisma from "../lib/prisma";
import { CustomerDashboard } from "./components/customer-dashboard";

type CustomerWithRelations = Customer & {
  stores: Array<{
    id: number;
    name: string;
    location: string;
    bills: Array<{
      id: number;
      total: number;
      products: Array<{ id: number }>;
    }>;
  }>;
};

async function getCustomers(): Promise<CustomerWithRelations[]> {
  return prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      stores: {
        include: {
          bills: {
            include: {
              products: true,
            },
          },
        },
      },
    },
  });
}

export default async function Home() {
  const customers = await getCustomers();

  return <CustomerDashboard customers={customers} />;
}
