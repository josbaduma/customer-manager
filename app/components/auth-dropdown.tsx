"use client";

import { useRouter } from "next/navigation";
import { Dropdown } from "./dropdown";

type AuthDropdownProps = {
  isLoggedIn: boolean;
};

export function AuthDropdown({ isLoggedIn }: AuthDropdownProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("No se pudo cerrar sesión");
      }

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const items = isLoggedIn
    ? [
        {
          label: "Cerrar sesión",
          onClick: handleLogout,
        },
      ]
    : [
        {
          label: "Login",
          href: "/login",
        },
        {
          label: "Registrar",
          href: "/register",
        },
      ];

  return <Dropdown label={isLoggedIn ? "Cuenta" : "Acceder"} items={items} />;
}
