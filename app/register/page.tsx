import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAuthToken } from "@/lib/auth";
import RegisterForm from "./register-form";

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  if (authToken && (await verifyAuthToken(authToken))) {
    redirect("/");
  }

  return <RegisterForm />;
}
