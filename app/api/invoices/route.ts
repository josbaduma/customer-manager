import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import prisma from "@/lib/prisma";
export const runtime = "nodejs";
import path from "path";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    customerId,
    storeId,
    total,
    items,
  } = body as {
    customerId?: number;
    storeId?: number;
    total?: number;
    items?: Array<{ productId?: number; description: string; quantity: number; price: number }>;
  };

  if (!customerId || !storeId || typeof total !== "number" || total <= 0 || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "customerId, storeId, total e items son requeridos." },
      { status: 400 },
    );
  }

  try {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    const store = await prisma.store.findUnique({ where: { id: storeId } });

    if (!customer || !store) {
      return NextResponse.json({ error: "Cliente o tienda no encontrados." }, { status: 404 });
    }

    const bill = await prisma.bill.create({
      data: {
        total,
        paidAmount: 0,
        status: "pending",
        store: { connect: { id: storeId } },
      },
    });

    await prisma.billItem.createMany({
      data: items.map((item) => ({
        bill_id: bill.id,
        description: item.description || "",
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      })),
    });

    const buffer = await generateInvoicePdf({
      bill,
      customer,
      store,
      items,
    });

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=Factura.pdf",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo crear la factura." }, { status: 500 });
  }
}

async function generateInvoicePdf({
  bill,
  customer,
  store,
  items,
}: {
  bill: { id: number; total: number; createdAt: Date; updatedAt: Date };
  customer: { name: string; email: string };
  store: { name: string; location: string };
  items: Array<{ description: string; quantity: number; price: number }>;
}) {
  const fontRegular = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
  const fontBold = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");

  const doc = new PDFDocument({ size: "A4", margin: 48, font: fontRegular });
  doc.registerFont("Regular", fontRegular);
  doc.registerFont("Bold", fontBold);
  const chunks: Uint8Array[] = [];

  doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
  const endPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const margin = 40;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - margin * 2;
  const emittedAt = new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const headerY = margin;
  doc.rect(margin, headerY, contentWidth, 90).fill("#0f172a");
  doc.fillColor("white");
  doc.font("Bold");
  doc.fontSize(22).text("Factura Comercial", margin + 24, headerY + 22, { width: contentWidth - 48 });
  doc.font("Regular");
  doc.fontSize(10).text(`Tienda de Camisas`, margin + 24, headerY + 54);
  doc.text(`Emitida: ${emittedAt}`, margin + 24, headerY + 70);

  doc.fontSize(10);
  doc.text(`Cliente: ${customer.name}`, margin + 320, headerY + 24, { width: 180 });
  doc.text(`Email: ${customer.email}`, margin + 320, headerY + 42, { width: 180 });
  doc.text(`Tienda: ${store.name}`, margin + 320, headerY + 60, { width: 180 });
  doc.text(`Ubicación: ${store.location}`, margin + 320, headerY + 78, { width: 180 });

  const infoY = headerY + 118;
  doc.fillColor("#f8fafc");
  doc.strokeColor("#cbd5e1");
  doc.lineWidth(1);
  doc.rect(margin, infoY, contentWidth, 70).fillAndStroke("#f8fafc", "#cbd5e1");
  doc.fillColor("#0f172a");
  doc.font("Bold");
  doc.fontSize(12).text("Datos del cliente", margin + 20, infoY + 16);
  doc.font("Regular");
  doc.fontSize(10).fillColor("#334155");
  doc.text(`Cliente: ${customer.name}`, margin + 20, infoY + 38);
  doc.text(`Email: ${customer.email}`, margin + 20, infoY + 54);
  doc.text(`Tienda: ${store.name}`, margin + 245, infoY + 38);
  doc.text(`Ubicación: ${store.location}`, margin + 245, infoY + 54);

  const tableTop = infoY + 110;
  const headerHeight = 24;
  const rowHeight = 24;
  const colX = [margin + 16, margin + 245, margin + 305, margin + 405];
  const colWidth = [200, 45, 100, 100];

  doc.fillColor("#0f172a");
  doc.rect(margin, tableTop, contentWidth, headerHeight).fill("#0f172a");
  doc.fillColor("white");
  doc.font("Bold");
  doc.fontSize(10);
  doc.text("Descripción", colX[0], tableTop + 7, { width: colWidth[0] });
  doc.text("Cantidad", colX[1], tableTop + 7, { width: colWidth[1], align: "center" });
  doc.text("Precio Unitario", colX[2], tableTop + 7, { width: colWidth[2], align: "right" });
  doc.text("Total", colX[3], tableTop + 7, { width: colWidth[3], align: "right" });

  const rowsTop = tableTop + headerHeight;
  items.forEach((item, index) => {
    const rowY = rowsTop + index * rowHeight;
    doc.rect(margin, rowY, contentWidth, rowHeight).fill(index % 2 === 0 ? "#f8fafc" : "white");
    doc.strokeColor("#e2e8f0");
    doc.lineWidth(0.5);
    doc.rect(margin, rowY, contentWidth, rowHeight).stroke();
    doc.fillColor("#334155");
    doc.font("Regular");
    doc.fontSize(9);
    doc.text(item.description, colX[0], rowY + 7, { width: colWidth[0] });
    doc.text(item.quantity.toString(), colX[1], rowY + 7, { width: colWidth[1], align: "center" });
    doc.text(formatCurrency(item.price), colX[2], rowY + 7, { width: colWidth[2], align: "right" });
    doc.text(formatCurrency(item.quantity * item.price), colX[3], rowY + 7, { width: colWidth[3], align: "right" });
  });

  const totalsY = rowsTop + items.length * rowHeight + 18;
  doc.fillColor("#0f172a");
  doc.rect(margin + 300, totalsY, 215, 60).fill("#f8fafc");
  doc.strokeColor("#cbd5e1");
  doc.lineWidth(1);
  doc.rect(margin + 300, totalsY, 215, 60).stroke();
  doc.fillColor("#0f172a");
  doc.font("Bold");
  doc.fontSize(11).text("Total a pagar", margin + 316, totalsY + 12);
  doc.fontSize(14).text(formatCurrency(bill.total), margin + 316, totalsY + 34, { width: 180, align: "right" });

  doc.font("Regular");
  doc.fontSize(9).fillColor("#64748b");
  doc.text("Gracias por su compra", margin, totalsY + 90, { align: "center", width: contentWidth });

  doc.end();
  return endPromise;
}

function formatCurrency(value: number) {
  return `CRC ${new Intl.NumberFormat('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)}`;
}
