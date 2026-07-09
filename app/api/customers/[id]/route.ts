import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json();
  const { name, email, phone } = body as {
    name?: string;
    email?: string;
    phone?: string | null;
  };

  const { id } = await params;
  const customerId = Number(id);
  if (Number.isNaN(customerId)) {
    return NextResponse.json(
      { error: "ID de cliente inválido." },
      { status: 400 },
    );
  }

  if (!name || !email) {
    return NextResponse.json(
      { error: "Nombre y correo son requeridos." },
      { status: 400 },
    );
  }

  const customer = await prisma.customer.update({
    where: { id: customerId },
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const customerId = Number(id);
  if (Number.isNaN(customerId)) {
    return NextResponse.json(
      { error: "ID de cliente inválido." },
      { status: 400 },
    );
  }

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: { deletedAt: new Date() },
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
