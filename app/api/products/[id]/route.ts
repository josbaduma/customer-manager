import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const productId = Number(id);

  if (Number.isNaN(productId)) {
    return NextResponse.json({ error: "ID de producto inválido." }, { status: 400 });
  }

  const existingProduct = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
  });

  if (!existingProduct) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo eliminar el producto." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const productId = Number(id);

  if (Number.isNaN(productId)) {
    return NextResponse.json({ error: "ID de producto inválido." }, { status: 400 });
  }

  const body = await request.json();
  const { name, quantity, price, description, storeId } = body as {
    name?: string;
    quantity?: number;
    price?: number;
    description?: string | null;
    storeId?: number;
  };
  const { paymentAmount } = body as { paymentAmount?: number };

  if (!name || typeof quantity !== "number" || quantity < 0 || typeof price !== "number" || price < 0) {
    return NextResponse.json(
      { error: "name, quantity y price son requeridos. quantity y price deben ser mayores o iguales a 0." },
      { status: 400 },
    );
  }

  const data: {
    name: string;
    quantity: number;
    price: number;
    description?: string | null;
    store?: { connect: { id: number } };
  } = {
    name,
    quantity,
    price,
    description,
  };

  if (storeId) {
    data.store = { connect: { id: storeId } };
  }

  try {
    const existingProduct = await prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    }

    // If a payment is provided, create a paid-history record.
    if (typeof paymentAmount === "number" && paymentAmount > 0) {
      await prisma.productPaidHistory.create({
        data: { product_id: productId, amountPaid: paymentAmount },
      });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data,
    });

    // Calculate total paid for this product
    const paidAgg = await prisma.productPaidHistory.aggregate({
      where: { product_id: productId },
      _sum: { amountPaid: true },
    });

    const paidTotal = paidAgg._sum.amountPaid ?? 0;
    const pending = product.price * product.quantity - paidTotal;

    return NextResponse.json({ product, paidTotal, pending });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo actualizar el producto." }, { status: 500 });
  }
}
