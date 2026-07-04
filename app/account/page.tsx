import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthPayload, verifyAuthToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AccountForm from "./account-form";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  if (!authToken || !(await verifyAuthToken(authToken))) {
    redirect("/login");
  }

  const payload = await getAuthPayload(authToken);
  if (!payload) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    redirect("/login");
  }

  return <AccountForm initialEmail={user.email} />;
}
