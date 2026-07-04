import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json();
  const { name, location } = body as { name?: string; location?: string };

  const { id } = await params;
  const storeId = Number(id);
  if (Number.isNaN(storeId)) {
    return NextResponse.json({ error: "ID de tienda inválido." }, { status: 400 });
  }

  if (!name || !location) {
    return NextResponse.json({ error: "Nombre y ubicación son requeridos." }, { status: 400 });
  }

  try {
    const store = await prisma.store.update({
      where: { id: storeId },
      data: { name, location },
    });

    return NextResponse.json({ store });
  } catch (err) {
    return NextResponse.json({ error: "No se pudo actualizar la tienda." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const storeId = Number(id);
  if (Number.isNaN(storeId)) {
    return NextResponse.json({ error: "ID de tienda inválido." }, { status: 400 });
  }

  try {
    const store = await prisma.store.update({
      where: { id: storeId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ store });
  } catch (err) {
    return NextResponse.json({ error: "No se pudo eliminar la tienda." }, { status: 500 });
  }
}