import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const billId = Number(id);
  if (Number.isNaN(billId)) {
    return NextResponse.json({ error: "ID de factura inválido." }, { status: 400 });
  }

  const body = await request.json();
  const { paymentAmount, action } = body as {
    paymentAmount?: number;
    action?: "partial" | "full";
  };

  const bill = await prisma.bill.findUnique({ where: { id: billId } });
  if (!bill) {
    return NextResponse.json({ error: "Factura no encontrada." }, { status: 404 });
  }

  const isFull = action === "full";
  let nextPaidAmount = bill.paidAmount;

  if (isFull) {
    nextPaidAmount = bill.total;
  } else {
    if (typeof paymentAmount !== "number" || paymentAmount <= 0) {
      return NextResponse.json({ error: "Monto de pago parcial inválido." }, { status: 400 });
    }

    nextPaidAmount = Math.min(bill.total, bill.paidAmount + paymentAmount);
  }

  const nextStatus = nextPaidAmount >= bill.total
    ? "paid"
    : nextPaidAmount > 0
      ? "partial"
      : "pending";

  try {
    const paidDelta = Math.max(0, nextPaidAmount - bill.paidAmount);

    const result = await prisma.$transaction(async (tx) => {
      const updatedBill = await tx.bill.update({
        where: { id: billId },
        data: {
          paidAmount: nextPaidAmount,
          status: nextStatus,
        },
      });

      if (paidDelta > 0) {
        await tx.paidHistory.create({
          data: {
            bill_id: billId,
            amountPaid: paidDelta,
          },
        });
      }

      return updatedBill;
    });

    return NextResponse.json({ bill: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo actualizar el pago." }, { status: 500 });
  }
}
