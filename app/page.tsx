import prisma from "@/lib/prisma";
import { CustomerDashboard, type CustomerWithRelations } from "./components/customer-dashboard";

async function getCustomers(): Promise<CustomerWithRelations[]> {
  return prisma.customer.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      stores: {
        include: {
          products: {
            include: {
              paidHistory: true,
            },
          },
          bills: {
            include: {
              paidHistory: true,
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
