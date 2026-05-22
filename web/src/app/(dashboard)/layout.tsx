import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionFromCookieStore, isPlatformAdmin } from "@/lib/auth";
import MerchantNav from "./MerchantNav";

const links = [
  { href: "/dashboard", label: "Tableau de bord", short: "DB" },
  { href: "/shops",     label: "Mes boutiques",   short: "MB" },
  { href: "/products",  label: "Produits",         short: "PR" },
  { href: "/orders",    label: "Commandes",        short: "CO" },
  { href: "/customers", label: "Clients",          short: "CL" },
  { href: "/settings",  label: "Paramètres",       short: "BT" },
  { href: "/whatsapp",  label: "WhatsApp",         short: "WA" },
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

        <MerchantNav links={navLinks} email={session.email} />
      </aside>

      <div className="app-main dashboard-main">{children}</div>
    </section>
  );
}
