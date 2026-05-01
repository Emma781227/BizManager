import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionFromCookieStore, isPlatformAdmin } from "@/lib/auth";
import MerchantNav from "./MerchantNav";

const links = [
  { href: "/dashboard", label: "Tableau de bord", short: "DB" },
  { href: "/products", label: "Produits", short: "PR" },
  { href: "/orders", label: "Commandes", short: "CO" },
  { href: "/customers", label: "Clients", short: "CL" },
  { href: "/settings", label: "Boutique", short: "BT" },
  { href: "/payments", label: "Paiements", short: "PA" },
  { href: "/whatsapp", label: "WhatsApp", short: "WA" },
  { href: "/admin", label: "Paramètres", short: "PM" },
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

        <div className="sidebar-promo">
          <div className="promo-icon">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="promo-title">Développez votre activité</h3>
          <p className="promo-text">Découvrez nos plans premium pour booster vos ventes</p>
          <a href="#plans" className="promo-button">Découvrir les plans</a>
        </div>

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
