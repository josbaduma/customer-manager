import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import prisma from "@/lib/prisma";

const require = createRequire(import.meta.url);
const pdfkitPackageDir = path.dirname(require.resolve("pdfkit/package.json"));
const pdfkitDataDir = path.join(pdfkitPackageDir, "js", "data");
const fallbackFonts = {
  "Helvetica.afm": `StartFontMetrics 4.1
FontName Helvetica
FullName Helvetica
FamilyName Helvetica
Weight Medium
ItalicAngle 0
IsFixedPitch false
CharacterSet ExtendedRoman
FontBBox -166 -225 1000 931
UnderlinePosition -100
UnderlineThickness 50
Version 002.000
EncodingScheme AdobeStandardEncoding
CapHeight 718
XHeight 523
Ascender 718
Descender -207
StartCharMetrics 5
C 32 ; WX 278 ; N space ; B 0 0 0 0 ;
C 65 ; WX 667 ; N A ; B 0 0 0 0 ;
C 66 ; WX 667 ; N B ; B 0 0 0 0 ;
C 97 ; WX 556 ; N a ; B 0 0 0 0 ;
C 98 ; WX 556 ; N b ; B 0 0 0 0 ;
EndCharMetrics
`,
  "Helvetica-Bold.afm": `StartFontMetrics 4.1
FontName Helvetica-Bold
FullName Helvetica Bold
FamilyName Helvetica
Weight Bold
ItalicAngle 0
IsFixedPitch false
CharacterSet ExtendedRoman
FontBBox -170 -228 1003 962
UnderlinePosition -100
UnderlineThickness 50
Version 002.000
EncodingScheme AdobeStandardEncoding
CapHeight 718
XHeight 532
Ascender 718
Descender -207
StartCharMetrics 5
C 32 ; WX 278 ; N space ; B 0 0 0 0 ;
C 65 ; WX 667 ; N A ; B 0 0 0 0 ;
C 66 ; WX 667 ; N B ; B 0 0 0 0 ;
C 97 ; WX 556 ; N a ; B 0 0 0 0 ;
C 98 ; WX 556 ; N b ; B 0 0 0 0 ;
EndCharMetrics
`,
};

function ensurePdfkitFonts() {
  mkdirSync(pdfkitDataDir, { recursive: true });

  for (const [fileName, contents] of Object.entries(fallbackFonts)) {
    const targetPath = path.join(pdfkitDataDir, fileName);

    if (existsSync(targetPath)) {
      continue;
    }

    const bundledFontPath = path.resolve(process.cwd(), "lib", "pdfkit-fonts", fileName);
    const sourceContents = existsSync(bundledFontPath)
      ? readFileSync(bundledFontPath, "utf8")
      : null;

    writeFileSync(targetPath, sourceContents ?? contents, "utf8");
  }
}

ensurePdfkitFonts();

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
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Uint8Array[] = [];

  doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
  const endPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.fontSize(20).text("Factura Comercial", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Cliente: ${customer.name}`);
  doc.text(`Email: ${customer.email}`);
  doc.text(`Tienda: ${store.name}`);
  doc.text(`Ubicación: ${store.location}`);
  doc.text(`Fecha: ${new Intl.DateTimeFormat("es-CR").format(new Date())}`);
  doc.moveDown();

  doc.fontSize(12).text("Detalle:");
  const tableTop = doc.y + 10;
  const itemTable = {
    headers: ["Descripción", "Cantidad", "Precio", "Total"],
    rows: items.map((item) => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.price),
      formatCurrency(item.quantity * item.price),
    ]),
  };

  doc.moveTo(48, tableTop - 8).lineTo(552, tableTop - 8).stroke();
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold");
  doc.text(itemTable.headers[0], 50, doc.y, { width: 240 });
  doc.text(itemTable.headers[1], 290, doc.y, { width: 80, align: "right" });
  doc.text(itemTable.headers[2], 370, doc.y, { width: 100, align: "right" });
  doc.text(itemTable.headers[3], 470, doc.y, { width: 100, align: "right" });
  doc.moveDown(0.5);
  doc.font("Helvetica");

  itemTable.rows.forEach((row) => {
    doc.text(row[0], 50, doc.y, { width: 240 });
    doc.text(row[1], 290, doc.y, { width: 80, align: "right" });
    doc.text(row[2], 370, doc.y, { width: 100, align: "right" });
    doc.text(row[3], 470, doc.y, { width: 100, align: "right" });
    doc.moveDown(0.5);
  });

  doc.moveDown();
  doc.font("Helvetica-Bold");
  doc.text(`Total: ${formatCurrency(bill.total)}`, { align: "right" });

  doc.end();
  return endPromise;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
  }).format(value);
}
