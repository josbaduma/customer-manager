import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  return NextResponse.json({
    message: "Login exitoso",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
}
