import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    storeId,
    name,
    quantity = 0,
    price,
    description,
  } = body as {
    storeId?: number;
    name?: string;
    quantity?: number;
    price?: number;
    description?: string | null;
  };

  const { paymentAmount } = body as { paymentAmount?: number };

  if (!storeId || !name || typeof price !== "number" || price < 0) {
    return NextResponse.json(
      { error: "storeId, name y price son requeridos. Price debe ser mayor o igual a 0." },
      { status: 400 },
    );
  }

  if (typeof quantity !== "number" || quantity < 0) {
    return NextResponse.json(
      { error: "quantity debe ser un número mayor o igual a 0." },
      { status: 400 },
    );
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        quantity,
        price,
        description,
        store: { connect: { id: storeId } },
      },
    });

    let paidTotal = 0;
    if (typeof paymentAmount === "number" && paymentAmount > 0) {
      await prisma.productPaidHistory.create({
        data: { product_id: product.id, amountPaid: paymentAmount },
      });
      paidTotal = paymentAmount;
    }

    const pending = product.price * product.quantity - paidTotal;

    return NextResponse.json({ product, paidTotal, pending });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo crear el producto." }, { status: 500 });
  }
}
