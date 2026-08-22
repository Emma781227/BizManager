import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  ChevronDown,
  CreditCard,
  Globe2,
  LineChart,
  Minus,
  Package,
  Rocket,
  ShieldCheck,
  Store,
  Check,
  Users,
  Wallet,
  MessageCircle,
} from "lucide-react";

import { getSessionFromCookieStore } from "@/lib/auth";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { DashboardPreview, StorefrontPreview } from "@/components/marketing/ProductPreview";
import {
  btnLg,
  btnMd,
  btnPrimary,
  btnSecondary,
  card,
  container,
  eyebrow,
  sectionLead,
  sectionTitle,
} from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "BizManager : créez votre boutique en ligne en Afrique",
  description:
    "Créez votre boutique en ligne en quelques minutes. Gérez vos produits, recevez des commandes et communiquez avec vos clients via WhatsApp. Gratuit pour démarrer.",
  openGraph: {
    title: "BizManager : créez votre boutique en ligne en Afrique",
    description:
      "Créez votre boutique en ligne en quelques minutes. Gérez vos produits, recevez des commandes et communiquez avec vos clients via WhatsApp.",
    type: "website",
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || "https://bizmanager.app",
  },
};

/* ── Contenu ──────────────────────────────────────────────────────── */

const VALUE_PROPS = [
  { icon: Wallet, label: "Gratuit pour démarrer", sub: "Sans carte bancaire" },
  { icon: Globe2, label: "Interface en français", sub: "Pensée pour l’Afrique" },
  { icon: MessageCircle, label: "WhatsApp intégré", sub: "Commandes et relances" },
  { icon: Rocket, label: "Prêt en 5 minutes", sub: "Catalogue et paiements" },
];

const FEATURES = [
  {
    icon: Store,
    title: "Gestion de boutique",
    body: "Créez votre boutique en ligne, gérez votre catalogue et partagez un lien public avec vos clients.",
  },
  {
    icon: Package,
    title: "Commandes de bout en bout",
    body: "Suivez chaque commande : création, confirmation, préparation, livraison et confirmation par code OTP.",
  },
  {
    icon: CreditCard,
    title: "Paiements",
    body: "Encaissez par Mobile Money, Orange Money ou virement, et enregistrez les règlements en espèces.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Business",
    body: "Partagez votre catalogue et relancez vos clients directement depuis le tableau de bord.",
  },
];

const STEPS = [
  {
    title: "Créez votre compte",
    body: "Inscrivez-vous gratuitement et configurez votre boutique en quelques clics.",
  },
  {
    title: "Ajoutez vos produits",
    body: "Importez votre catalogue, fixez vos prix et activez votre boutique publique.",
  },
  {
    title: "Recevez vos commandes",
    body: "Vos clients commandent, vous êtes notifié et vous pilotez tout depuis le tableau de bord.",
  },
];

/** Indicateurs mis en avant dans la section « Aperçu » (valeurs d'illustration). */
const DASHBOARD_HIGHLIGHTS = [
  { label: "Ventes du mois", value: "1 284 500 CFA", hint: "+18,2 % vs mois dernier" },
  { label: "Commandes", value: "147", hint: "12 à confirmer" },
  { label: "Panier moyen", value: "8 738 CFA", hint: "+4,1 %" },
];

const DASHBOARD_BULLETS = [
  "Alertes automatiques sur les stocks faibles et les ruptures",
  "Suivi des paiements reçus, partiels et en attente",
  "Répartition des ventes par canal : WhatsApp, boutique en ligne, manuel",
];

const DIFFERENTIATORS = [
  {
    icon: MessageCircle,
    title: "Conçu autour de WhatsApp",
    body: "Vos clients commandent là où ils sont déjà. Pas d’application à installer, pas de compte à créer pour eux.",
  },
  {
    icon: Wallet,
    title: "Pensé pour le franc CFA",
    body: "Prix, encaissements et rapports en FCFA, avec Mobile Money et Orange Money via GeniusPay.",
  },
  {
    icon: Users,
    title: "Multi-boutique et multi-équipe",
    body: "Gérez plusieurs points de vente et invitez vos collaborateurs avec des rôles et permissions.",
  },
];

type Plan = {
  name: string;
  price: string;
  tagline: string;
  features: { text: string; included: boolean }[];
  cta: string;
  href: string;
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    price: "0 FCFA",
    tagline: "Pour démarrer sans risque",
    href: "/register?plan=starter",
    cta: "Commencer gratuitement",
    features: [
      { text: "1 boutique", included: true },
      { text: "20 produits", included: true },
      { text: "Commandes illimitées", included: true },
      { text: "Partage WhatsApp", included: true },
      { text: "Analytics avancés", included: false },
      { text: "Support prioritaire", included: false },
    ],
  },
  {
    name: "Business",
    price: "4 500 FCFA",
    tagline: "Pour les boutiques en croissance",
    href: "/register?plan=business",
    cta: "Choisir Business",
    featured: true,
    features: [
      { text: "3 boutiques", included: true },
      { text: "500 produits", included: true },
      { text: "Commandes illimitées", included: true },
      { text: "Analytics complets", included: true },
      { text: "Gestion clients et équipe", included: true },
      { text: "Support prioritaire", included: true },
    ],
  },
  {
    name: "Premium",
    price: "10 000 FCFA",
    tagline: "Pour les pros multi-boutiques",
    href: "/register?plan=premium",
    cta: "Choisir Premium",
    features: [
      { text: "10 boutiques", included: true },
      { text: "Produits illimités", included: true },
      { text: "Tout Business inclus", included: true },
      { text: "Rapports personnalisés", included: true },
      { text: "Accompagnement dédié", included: true },
      { text: "Onboarding guidé", included: true },
    ],
  },
];

const FAQ = [
  {
    q: "Est-ce vraiment gratuit pour commencer ?",
    a: "Oui. Le plan Starter est entièrement gratuit, sans carte bancaire. Il vous permet de créer 1 boutique avec jusqu’à 20 produits et de recevoir des commandes illimitées. Vous ne payez que si vous choisissez un plan supérieur.",
  },
  {
    q: "Comment fonctionne l’intégration WhatsApp ?",
    a: "BizManager génère un lien de partage de votre boutique que vous envoyez à vos clients via WhatsApp. Vos clients consultent vos produits, passent commande, et vous recevez une notification. Vous pouvez aussi envoyer des messages de suivi depuis le tableau de bord.",
  },
  {
    q: "Mes clients peuvent-ils payer en ligne ?",
    a: "Oui. BizManager intègre GeniusPay pour accepter les paiements via Orange Money, Mobile Money et virement bancaire. Vous pouvez également enregistrer les paiements en espèces depuis le tableau de bord.",
  },
  {
    q: "L’application fonctionne-t-elle sur mobile ?",
    a: "Le tableau de bord marchand est accessible depuis n’importe quel navigateur, sur ordinateur comme sur mobile. La boutique publique est entièrement optimisée pour le mobile : vos clients commandent depuis leur téléphone.",
  },
  {
    q: "Puis-je ajouter des membres à mon équipe ?",
    a: "Oui, dès le plan Business vous pouvez inviter des collaborateurs avec des rôles et des permissions configurables. Chaque membre ne voit que les boutiques auxquelles il a accès.",
  },
  {
    q: "Comment sont sécurisées mes données ?",
    a: "Vos données sont stockées sur une base PostgreSQL chiffrée et l’application est servie en HTTPS. Les mots de passe sont hachés avec bcrypt. Aucune donnée sensible n’est transmise à des tiers sans votre accord.",
  },
  {
    q: "Puis-je gérer plusieurs boutiques ?",
    a: "Oui. Le plan Business autorise jusqu’à 3 boutiques, le plan Premium jusqu’à 10. Chaque boutique a son propre catalogue, ses propres commandes et son propre lien public.",
  },
  {
    q: "Comment résilier mon abonnement ?",
    a: "Vous pouvez résilier à tout moment depuis votre tableau de bord, sans engagement. Vous conservez l’accès jusqu’à la fin de la période payée. Vos données sont supprimées dans un délai de 30 jours après résiliation.",
  },
];

/* ── Page ─────────────────────────────────────────────────────────── */

export default async function HomePage() {
  const cookieStore = await cookies();
  const session = await getSessionFromCookieStore(cookieStore);
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white text-ink-900">
      <MarketingHeader />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="border-b border-ink-100 bg-ink-50">
        <div className={`${container} grid items-center gap-12 py-16 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-12 lg:py-20`}>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[0.8125rem] font-semibold text-brand-700">
              <BadgeCheck size={14} strokeWidth={2.25} />
              Boutique · WhatsApp · Paiements
            </span>

            <h1 className="mt-6 text-[2.5rem] font-bold leading-[1.08] tracking-[-0.02em] text-ink-900 sm:text-[3.25rem]">
              Gérez votre boutique simplement.
            </h1>

            <p className="mt-5 max-w-[34rem] text-[1.0625rem] leading-relaxed text-ink-500">
              BizManager réunit vos produits, vos commandes, vos clients et vos paiements
              au même endroit. Vos clients, eux, commandent sur WhatsApp.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className={`${btnPrimary} ${btnLg}`}>
                Créer ma boutique
              </Link>
              <Link href="#how" className={`${btnSecondary} ${btnLg}`}>
                Comment ça marche
              </Link>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
              {["Gratuit pour démarrer", "Sans carte bancaire", "En français"].map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-[0.8125rem] text-ink-500">
                  <Check size={14} strokeWidth={2.5} className="text-brand-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:pl-4">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ── Bandeau valeurs ──────────────────────────────────────── */}
      <section className="border-b border-ink-100">
        <div className={`${container} grid divide-ink-100 py-2 sm:grid-cols-2 sm:divide-x lg:grid-cols-4`}>
          {VALUE_PROPS.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3 px-1 py-5 sm:px-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon size={18} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900">{label}</p>
                <p className="mt-0.5 text-[0.8125rem] text-ink-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Fonctionnalités ──────────────────────────────────────── */}
      <section id="features" className="scroll-mt-20 py-20">
        <div className={container}>
          <div className="max-w-2xl">
            <p className={eyebrow}>Fonctionnalités</p>
            <h2 className={`${sectionTitle} mt-3`}>Tout ce qu’il vous faut pour vendre</h2>
            <p className={sectionLead}>
              Une plateforme complète, sans module à assembler ni configuration technique.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article key={title} className={`${card} p-6`}>
                <span className="flex size-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon size={20} strokeWidth={1.9} />
                </span>
                <h3 className="mt-5 text-[1.0625rem] font-semibold text-ink-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ────────────────────────────────────── */}
      <section id="how" className="scroll-mt-20 border-y border-ink-100 bg-ink-50 py-20">
        <div className={container}>
          <div className="max-w-2xl">
            <p className={eyebrow}>Mise en route</p>
            <h2 className={`${sectionTitle} mt-3`}>Votre boutique en ligne en trois étapes</h2>
            <p className={sectionLead}>Comptez moins de cinq minutes de la création du compte au premier partage.</p>
          </div>

          <ol className="mt-10 grid gap-5 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className={`${card} relative p-6`}>
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-[1.0625rem] font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Aperçu produit ───────────────────────────────────────── */}
      <section id="product" className="scroll-mt-20 py-20">
        <div className={container}>
          <div className="max-w-2xl">
            <p className={eyebrow}>Aperçu</p>
            <h2 className={`${sectionTitle} mt-3`}>Deux faces, une seule plateforme</h2>
            <p className={sectionLead}>
              Un tableau de bord complet pour vous, une boutique rapide et mobile pour vos clients.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <article className={`${card} overflow-hidden p-6`}>
              <div className="flex items-center gap-2 text-brand-700">
                <LineChart size={16} strokeWidth={2} />
                <span className="text-[0.75rem] font-semibold uppercase tracking-[0.1em]">
                  Tableau de bord
                </span>
              </div>
              <h3 className="mt-3 text-xl font-semibold text-ink-900">Pilotez votre activité</h3>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-500">
                Chiffre d’affaires, commandes en cours, panier moyen et stock faible : tout
                l’essentiel visible dès l’ouverture.
              </p>

              <dl className="mt-6 grid gap-px overflow-hidden rounded-lg border border-ink-200 bg-ink-200 sm:grid-cols-3">
                {DASHBOARD_HIGHLIGHTS.map((item) => (
                  <div key={item.label} className="bg-white p-4">
                    <dt className="text-[0.75rem] font-medium text-ink-500">{item.label}</dt>
                    <dd className="mt-1.5 text-lg font-bold tracking-tight text-ink-900">{item.value}</dd>
                    <dd className="mt-0.5 text-[0.75rem] text-ink-400">{item.hint}</dd>
                  </div>
                ))}
              </dl>

              <ul className="mt-5 space-y-2.5">
                {DASHBOARD_BULLETS.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5">
                    <Check size={15} strokeWidth={2.5} className="mt-0.5 shrink-0 text-brand-600" />
                    <span className="text-sm text-ink-600">{bullet}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className={`${card} flex flex-col p-6`}>
              <div className="flex items-center gap-2 text-brand-700">
                <Store size={16} strokeWidth={2} />
                <span className="text-[0.75rem] font-semibold uppercase tracking-[0.1em]">
                  Boutique publique
                </span>
              </div>
              <h3 className="mt-3 text-xl font-semibold text-ink-900">Un lien, et c’est tout</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                Partagez l’adresse de votre boutique. Vos clients parcourent le catalogue et
                commandent depuis leur téléphone.
              </p>
              <div className="mt-6 flex flex-1 items-end justify-center rounded-lg bg-ink-50 pt-6">
                <StorefrontPreview />
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── Différenciateurs ─────────────────────────────────────── */}
      <section className="border-y border-ink-100 bg-ink-50 py-20">
        <div className={container}>
          <div className="max-w-2xl">
            <p className={eyebrow}>Pourquoi BizManager</p>
            <h2 className={`${sectionTitle} mt-3`}>Construit pour le commerce africain</h2>
            <p className={sectionLead}>
              Pas un outil générique traduit en français, mais une plateforme pensée pour vos usages.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {DIFFERENTIATORS.map(({ icon: Icon, title, body }) => (
              <article key={title} className={`${card} p-6`}>
                <span className="flex size-11 items-center justify-center rounded-lg bg-white text-brand-600 ring-1 ring-inset ring-brand-200">
                  <Icon size={20} strokeWidth={1.9} />
                </span>
                <h3 className="mt-5 text-[1.0625rem] font-semibold text-ink-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tarifs ───────────────────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-20 py-20">
        <div className={container}>
          <div className="max-w-2xl">
            <p className={eyebrow}>Tarifs</p>
            <h2 className={`${sectionTitle} mt-3`}>Choisissez votre plan</h2>
            <p className={sectionLead}>Démarrez gratuitement, changez de plan quand votre activité grandit.</p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                className={
                  plan.featured
                    ? "relative rounded-xl border-2 border-brand-600 bg-white p-7 shadow-md"
                    : `${card} p-7`
                }
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-7 rounded-full bg-brand-600 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-white">
                    Le plus populaire
                  </span>
                )}

                <h3
                  className={`text-sm font-semibold uppercase tracking-[0.08em] ${
                    plan.featured ? "text-brand-700" : "text-ink-500"
                  }`}
                >
                  {plan.name}
                </h3>

                <p className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-[2rem] font-bold tracking-tight text-ink-900">{plan.price}</span>
                  <span className="text-sm text-ink-500">/mois</span>
                </p>
                <p className="mt-1.5 text-sm text-ink-500">{plan.tagline}</p>

                <ul className="mt-6 space-y-2.5 border-t border-ink-100 pt-6">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-2.5">
                      {feature.included ? (
                        <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-brand-600" />
                      ) : (
                        <Minus size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-ink-300" />
                      )}
                      <span
                        className={`text-sm ${feature.included ? "text-ink-700" : "text-ink-400"}`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`${plan.featured ? btnPrimary : btnSecondary} ${btnMd} mt-7 w-full`}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-[0.8125rem] text-ink-500">
            <ShieldCheck size={15} strokeWidth={2} className="text-ink-400" />
            Sans engagement, résiliable à tout moment depuis votre tableau de bord.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-20 border-t border-ink-100 bg-ink-50 py-20">
        <div className={container}>
          <div className="mx-auto max-w-2xl text-center">
            <p className={eyebrow}>FAQ</p>
            <h2 className={`${sectionTitle} mt-3`}>Questions fréquentes</h2>
            <p className={sectionLead}>Tout ce qu’il faut savoir avant de démarrer.</p>
          </div>

          <div className="mx-auto mt-10 max-w-[45rem] space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group overflow-hidden rounded-lg border border-ink-200 bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[0.9375rem] font-semibold text-ink-900">
                  {item.q}
                  <ChevronDown
                    size={18}
                    strokeWidth={2}
                    className="shrink-0 text-ink-400 transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <div className="border-t border-ink-100 px-5 py-4 text-sm leading-relaxed text-ink-500">
                  {item.a}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-ink-500">Vous avez une autre question ?</p>
            <a
              href="mailto:contact@bizmanager.africa"
              className={`${btnSecondary} ${btnMd} mt-3`}
            >
              Nous contacter
            </a>
          </div>
        </div>
      </section>

      {/* ── Appel à l’action ─────────────────────────────────────── */}
      <section className="py-20">
        <div className={container}>
          <div className="flex flex-col items-start justify-between gap-8 rounded-2xl bg-brand-700 px-8 py-12 sm:px-12 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="text-[1.75rem] font-bold tracking-tight text-white sm:text-[2rem]">
                Prêt à lancer votre boutique ?
              </h2>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-brand-100">
                Créez votre boutique gratuitement et recevez vos premières commandes dès aujourd’hui.
              </p>
            </div>
            <Link
              href="/register"
              className={`${btnLg} shrink-0 rounded-lg bg-white font-semibold text-brand-700 transition-colors hover:bg-brand-50`}
            >
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
