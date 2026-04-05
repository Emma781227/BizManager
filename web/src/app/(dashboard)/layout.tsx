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
    <section className="app-shell">
      <aside className="app-sidebar card">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden>
            BM
          </span>
          <div>
            <strong>BizManager</strong>
            <p>Back-office commerçant</p>
          </div>
        </div>

        <MerchantNav links={navLinks} />

        <form className="sidebar-logout" action="/api/auth/logout" method="post">
          <button type="submit">Deconnexion</button>
        </form>
      </aside>

      <div className="app-main">{children}</div>
    </section>
  );
}
