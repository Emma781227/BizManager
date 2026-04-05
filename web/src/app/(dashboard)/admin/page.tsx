import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";
import { getSessionFromCookieStore, isPlatformAdmin } from "@/lib/auth";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = await getSessionFromCookieStore(cookieStore);

  if (!session) {
    redirect("/login");
  }

  if (!isPlatformAdmin(session)) {
    redirect("/dashboard");
  }

  return <AdminDashboardClient />;
}
