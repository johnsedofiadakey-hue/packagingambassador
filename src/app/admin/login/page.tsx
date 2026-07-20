import type { Metadata } from "next";
import { LoginForm } from "@/app/admin/login/LoginForm";

export const metadata: Metadata = {
  title: "Admin Login — Packaging Ambassadors",
};

export default function AdminLoginPage() {
  return <LoginForm />;
}
