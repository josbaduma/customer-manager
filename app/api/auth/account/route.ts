import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthPayload, verifyAuthToken } from "@/lib/auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;
  if (!authToken || !(await verifyAuthToken(authToken))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const payload = await getAuthPayload(authToken);
  if (!payload) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const body = await request.json();
  const { email, currentPassword, newPassword } = body as {
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const updates: { email?: string; password?: string } = {};

  if (email && email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "El correo ya está en uso" }, { status: 409 });
    }
    updates.email = email;
  }

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "La contraseña actual es requerida" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 401 });
    }

    updates.password = await bcrypt.hash(newPassword, 10);
  }

  if (!updates.email && !updates.password) {
    return NextResponse.json({ error: "No se proporcionaron cambios" }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updates,
  });

  return NextResponse.json({
    message: "Cuenta actualizada correctamente",
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
    },
  });
}
