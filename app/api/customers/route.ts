import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, phone } = body as {
    name?: string;
    email?: string;
    phone?: string | null;
  };

  if (!name || !email) {
    return NextResponse.json({ error: "Nombre y correo son requeridos." }, { status: 400 });
  }

  const existingCustomer = await prisma.customer.findUnique({ where: { email } });
  if (existingCustomer) {
    return NextResponse.json({ error: "El correo ya está registrado." }, { status: 409 });
  }

  const customer = await prisma.customer.create({
    data: {
      name,
      email,
      phone,
    },
    include: {
      stores: {
        include: {
          products: true,
          bills: {
            include: {
              paidHistory: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ customer });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim();

  const customers = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      stores: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          products: {
            where: { deletedAt: null },
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

  return NextResponse.json({ customers });
}
