import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, location, customerId } = body as {
    name?: string;
    location?: string;
    customerId?: number;
  };

  if (!name || !location || !customerId) {
    return NextResponse.json({ error: "Nombre, ubicación y customerId son requeridos." }, { status: 400 });
  }

  try {
    const store = await prisma.store.create({
      data: {
        name,
        location,
        customer: { connect: { id: customerId } },
      },
    });

    return NextResponse.json({ store });
  } catch (err) {
    return NextResponse.json({ error: "No se pudo crear la tienda." }, { status: 500 });
  }
}