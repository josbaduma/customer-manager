import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAuthToken } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  if (authToken && (await verifyAuthToken(authToken))) {
    redirect("/");
  }

  return <LoginForm />;
}
