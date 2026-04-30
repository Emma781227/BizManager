import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionFromCookieStore, isPlatformAdmin } from "@/lib/auth";
import MerchantNav from "./MerchantNav";

const links = [
  { href: "/dashboard", label: "Dashboard", short: "DB" },
  { href: "/products", label: "Produits", short: "PR" },
  { href: "/customers", label: "Clients", short: "CL" },
  { href: "/orders", label: "Commandes", short: "CO" },
  { href: "/whatsapp", label: "WhatsApp", short: "WA" },
  { href: "/settings", label: "Boutique", short: "BT" },
  { href: "/share", label: "Partage", short: "SH" },
];

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const session = await getSessionFromCookieStore(cookieStore);

  if (!session) {
    redirect("/login");
  }

  const navLinks = isPlatformAdmin(session)
    ? [...links, { href: "/admin", label: "Plateforme", short: "PL" }]
    : links;

  return (
    <section className="app-shell dashboard-shell">
      <aside className="app-sidebar dashboard-sidebar card">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden>
            BM
          </span>
          <div className="sidebar-brand-copy">
            <strong>BizManager</strong>
            <p>Back-office commerçant</p>
          </div>
        </div>

        <div className="sidebar-account">
          <span>Compte connecté</span>
          <strong>{session.email}</strong>
        </div>

        <MerchantNav links={navLinks} />

        <div className="sidebar-footer">
          <p>Suivi des ventes, commandes et clients en temps réel.</p>
          <form className="sidebar-logout" action="/api/auth/logout" method="post">
            <button type="submit">Déconnexion</button>
          </form>
        </div>
      </aside>

      <div className="app-main dashboard-main">{children}</div>
    </section>
  );
}
