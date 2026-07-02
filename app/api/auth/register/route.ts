import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, password } = body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nombre, email y contraseña son requeridos" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return NextResponse.json({
    message: "Usuario creado",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
}
