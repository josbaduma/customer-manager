import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { storeId, total, products } = body as {
    storeId?: number;
    total?: number;
    products?: Array<{ name?: string; description?: string | null; price: number; units?: number }>;
  };

  if (!storeId || typeof total !== "number" || total <= 0) {
    return NextResponse.json(
      { error: "storeId y total son requeridos y total debe ser mayor a 0." },
      { status: 400 },
    );
  }

  try {
    const bill = await prisma.bill.create({
      data: {
        total,
        paidAmount: 0,
        status: "pending",
        store: { connect: { id: storeId } },
        products: products
          ? {
              create: products.map((p) => ({
                name: p.name ?? `Item`,
                description: p.description ?? null,
                price: p.price,
              })),
            }
          : undefined,
      },
      include: { products: true },
    });

    return NextResponse.json({ bill });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo crear la factura." }, { status: 500 });
  }
}
