import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Sesión cerrada" });

  response.cookies.set("auth_token", "", {
    httpOnly: true,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });

  return response;
}
