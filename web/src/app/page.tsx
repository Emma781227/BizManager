"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

/* ── Scroll-triggered animation wrapper ── */
function Reveal({
  children,
  className = "",
  animation = "animate-fade-up",
  delay = "",
}: {
  children: ReactNode;
  className?: string;
  animation?: string;
  delay?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "";
          el.classList.add(animation);
          if (delay) el.classList.add(delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animation, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

const testimonials = [
  {
    quote:
      "Fini les carnets et les oublis ! Tout est automatique. Je vois mes stocks en temps reel et je ne perds plus de ventes.",
    name: "Joseph Kamga",
    initials: "JK",
    role: "Commercant alimentaire",
    location: "Douala, Cameroun",
  },
  {
    quote:
      "Mes clients adorent commander sur WhatsApp. En 2 semaines, j'ai double mes ventes sans changer mes habitudes.",
    name: "Aminata Diallo",
    initials: "AD",
    role: "Vendeuse de cosmetiques",
    location: "Dakar, Senegal",
  },
  {
    quote:
      "Avant BizManager, je perdais du temps a noter les commandes a la main. Maintenant tout est centralise sur mon telephone.",
    name: "Patrick Mbarga",
    initials: "PM",
    role: "Epicier grossiste",
    location: "Yaounde, Cameroun",
  },
];

function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(id);
  }, [current]);

  const goTo = (index: number) => {
    setCurrent(index);
  };

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-[#daf2e9]/40 blur-[64px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6">
        <Reveal className="text-center mb-16" animation="animate-fade-up">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Ils nous font confiance
          </h2>
          <p className="text-xl text-[#6a707a] mt-4">
            Decouvrez comment BizManager transforme leur commerce
          </p>
        </Reveal>

        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {testimonials.map((item) => (
              <div key={item.name} className="w-full shrink-0 px-1">
                <div className="bg-white/80 border border-[#e8e6e3] rounded-2xl p-8 hover-glow transition-shadow duration-500">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Image key={i} src="/landing/icon-star.svg" alt="" width={18} height={18} />
                    ))}
                  </div>

                  <p className="text-base leading-relaxed mb-8 min-h-[52px]">
                    &quot;{item.quote}&quot;
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#1d7c5f] rounded-full flex items-center justify-center text-white font-bold">
                      {item.initials}
                    </div>
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-sm text-[#6a707a]">
                        {item.role} &bull; {item.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Temoignage ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 bg-[#1d7c5f]"
                  : "w-2 bg-[#e8e6e3] hover:bg-[#c5cac7]"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="bg-[#faf9f7] text-[#20232b] font-[var(--font-app-sans)]">
      {/* ── Green top bar ── */}
      <div className="h-1 bg-[#1d7c5f]" />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/80 border-b border-[#e8e6e3]/80 backdrop-blur-xl shadow-sm">
        <nav className="flex items-center justify-between max-w-6xl mx-auto px-6 h-20">
          <Link href="/" className="flex items-center gap-3 hover-scale">
            <span className="w-10 h-10 bg-[#1d7c5f] rounded-2xl flex items-center justify-center text-white font-bold text-lg">
              BM
            </span>
            <span className="text-xl font-bold tracking-tight">BizManager</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-base font-medium hover:text-[#1d7c5f] transition-colors duration-200">
              Fonctionnalites
            </Link>
            <Link href="#how" className="text-base font-medium hover:text-[#1d7c5f] transition-colors duration-200">
              Comment ca marche
            </Link>
            <Link href="#testimonials" className="text-[#6a707a] text-base font-medium hover:text-[#1d7c5f] transition-colors duration-200">
              Temoignages
            </Link>
            <Link
              href="/login"
              className="bg-[#1d7c5f] text-white px-6 py-2.5 rounded-xl font-medium text-base hover:bg-[#14634c] hover-scale active-press transition-all duration-200"
            >
              Commencer gratuitement
            </Link>
          </div>
          <Link
            href="/login"
            className="md:hidden bg-[#1d7c5f] text-white px-5 py-2 rounded-xl font-medium text-sm active-press"
          >
            Commencer
          </Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-20 lg:pb-32">
        {/* Background blurs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#1d7c5f]/5 blur-[64px] pointer-events-none animate-fade-in" />
        <div className="absolute top-[220px] left-0 w-[500px] h-[500px] rounded-full bg-[#daf2e9]/40 blur-[64px] pointer-events-none animate-fade-in stagger-3" />

        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#daf2e9] rounded-full px-4 py-2 mb-6 animate-fade-up">
              <Image src="/landing/icon-platform.svg" alt="" width={18} height={18} />
              <span className="text-sm font-medium text-[#1d7c5f]">
                Plateforme SaaS pour commercants
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[60px] font-bold leading-[1.15] tracking-tight mb-6 animate-fade-up stagger-1">
              Vendez en ligne depuis votre telephone
            </h1>

            <p className="text-xl text-[#6a707a] leading-relaxed mb-8 max-w-lg animate-fade-up stagger-2">
              Creez votre boutique en ligne, gerez vos produits et recevez vos
              commandes via WhatsApp. Simple, rapide, mobile.
            </p>

            <div className="flex flex-wrap gap-4 mb-8 animate-fade-up stagger-3">
              <Link
                href="/login"
                className="bg-[#1d7c5f] text-white px-8 py-4 rounded-2xl font-medium text-base flex items-center gap-2 hover:bg-[#14634c] shadow-lg shadow-[#1d7c5f]/20 hover-scale active-press transition-all duration-200"
              >
                Creer ma boutique
                <Image src="/landing/icon-arrow.svg" alt="" width={20} height={20} />
              </Link>
              <Link
                href="/shop/bizmanager-douala"
                className="bg-white border border-[#dde0e4] px-8 py-4 rounded-2xl font-medium text-base hover:bg-[#f6f7f7] hover-scale active-press transition-all duration-200"
              >
                Voir la demo
              </Link>
            </div>
          </div>

          {/* Right — Mock Dashboard */}
          <div className="relative hidden lg:block animate-slide-right stagger-2">
            {/* Notification badge */}
            <div className="absolute -top-4 right-8 z-20 bg-[#1d7c5f] text-white rounded-xl px-4 py-2 shadow-lg animate-bounce-gentle">
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#25d366] rounded-full animate-pulse-dot" />
              <p className="text-xs opacity-80">Nouvelle commande</p>
              <p className="text-base font-bold">+2,500 FCFA</p>
            </div>

            <div className="bg-white border border-[#dde0e4] rounded-3xl p-8 shadow-2xl animate-float hover-glow transition-shadow duration-500">
              {/* Top bar */}
              <div className="flex items-center justify-between border-b border-[#dde0e4] pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1d7c5f] rounded-2xl flex items-center justify-center">
                    <Image src="/landing/icon-store.svg" alt="" width={20} height={20} />
                  </div>
                  <div>
                    <p className="font-medium">Ma Boutique</p>
                    <p className="text-sm text-[#6a707a]">En ligne</p>
                  </div>
                </div>
                <div className="w-3 h-3 rounded-full bg-[#25d366] animate-pulse-dot" />
              </div>

              {/* Tabs */}
              <div className="bg-[#f6f7f7] rounded-xl p-1 flex gap-2 mb-6">
                <div className="flex-1 bg-white rounded-xl py-2 text-center text-sm font-medium text-[#1d7c5f] shadow-sm">
                  Vue d&apos;ensemble
                </div>
                <div className="flex-1 py-2 text-center text-sm font-medium text-[#6a707a]">
                  Commandes
                </div>
                <div className="flex-1 py-2 text-center text-sm font-medium text-[#6a707a]">
                  Produits
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#f6f7f7] rounded-2xl p-4 hover-lift">
                  <p className="text-sm text-[#6a707a]">Ventes</p>
                  <p className="text-2xl font-bold mt-1">247</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Image src="/landing/icon-trend.svg" alt="" width={12} height={12} />
                    <span className="text-xs text-[#1d7c5f]">+12%</span>
                  </div>
                </div>
                <div className="bg-[#f6f7f7] rounded-2xl p-4 hover-lift">
                  <p className="text-sm text-[#6a707a]">Produits</p>
                  <p className="text-2xl font-bold mt-1">64</p>
                  <p className="text-xs text-[#6a707a] mt-2">actifs</p>
                </div>
                <div className="bg-[#f6f7f7] rounded-2xl p-4 hover-lift">
                  <p className="text-sm text-[#6a707a]">Clients</p>
                  <p className="text-2xl font-bold mt-1">189</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Image src="/landing/icon-trend.svg" alt="" width={12} height={12} />
                    <span className="text-xs text-[#1d7c5f]">+8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-[#e8e6e3] bg-gradient-to-r from-white via-[#fcfefd] to-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-8">
            {[
              { value: "2 400+", label: "Commercants actifs" },
              { value: "18 500+", label: "Commandes traitees" },
              { value: "98%", label: "Satisfaction client" },
              { value: "6 pays", label: "En Afrique" },
            ].map((s, i) => (
              <Reveal key={s.label} animation="animate-count" delay={`stagger-${i + 1}`}>
                <p className="text-4xl font-bold text-[#1d7c5f]">{s.value}</p>
                <p className="text-base text-[#6a707a] mt-2">{s.label}</p>
              </Reveal>
            ))}
          </div>
          <Reveal animation="animate-fade-up" delay="stagger-5">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 bg-[#daf2e9] rounded-full px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-[#1d7c5f] animate-pulse-dot" />
                <span className="text-sm font-medium text-[#1d7c5f]">
                  12 commercants se sont inscrits aujourd&apos;hui
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative py-24 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-[#daf2e9]/30 blur-[64px] pointer-events-none" />
        <div className="absolute bottom-20 right-0 w-96 h-96 rounded-full bg-[#1d7c5f]/5 blur-[64px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative">
          <Reveal className="text-center mb-16" animation="animate-fade-up">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-[#6a707a] mt-4 max-w-2xl mx-auto">
              Des outils simples et puissants pour developper votre commerce
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "/landing/icon-boost.svg",
                title: "Boostez vos ventes",
                desc: "Atteignez plus de clients avec votre boutique en ligne accessible 24/7",
              },
              {
                icon: "/landing/icon-stock.svg",
                title: "Stock automatise",
                desc: "Gerez votre inventaire en temps reel et evitez les ruptures de stock",
              },
              {
                icon: "/landing/icon-clients.svg",
                title: "Gestion clients",
                desc: "Suivez vos clients, leur historique d'achats et fidelisez-les facilement",
              },
              {
                icon: "/landing/icon-dashboard.svg",
                title: "Tableau de bord",
                desc: "Visualisez vos performances et prenez de meilleures decisions",
              },
            ].map((f, i) => (
              <Reveal key={f.title} animation="animate-fade-up" delay={`stagger-${i + 1}`}>
                <div className="bg-white/80 border border-[#e8e6e3] rounded-2xl p-8 hover-lift hover-glow cursor-default h-full">
                  <div className="w-14 h-14 bg-[#daf2e9] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Image src={f.icon} alt="" width={28} height={28} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-base text-[#6a707a] leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="relative py-24 overflow-hidden bg-gradient-to-b from-white via-[#fcfefd] to-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-16" animation="animate-fade-up">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Comment ca marche ?
            </h2>
            <p className="text-xl text-[#6a707a] mt-4 max-w-2xl mx-auto">
              Lancez votre boutique en ligne en 3 etapes simples
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-px bg-[#dde0e4]" />

            {[
              {
                num: "01",
                icon: "/landing/icon-step1.svg",
                title: "Creez votre boutique",
                desc: "Inscrivez-vous et personnalisez votre espace en quelques minutes depuis votre telephone",
              },
              {
                num: "02",
                icon: "/landing/icon-step2.svg",
                title: "Ajoutez vos produits",
                desc: "Importez vos articles avec photos, prix et descriptions. Simple comme bonjour",
              },
              {
                num: "03",
                icon: "/landing/icon-step3.svg",
                title: "Recevez vos commandes",
                desc: "Les clients commandent directement via WhatsApp. Vous gerez tout depuis l'app",
              },
            ].map((s, i) => (
              <Reveal key={s.num} animation="animate-fade-up" delay={`stagger-${(i + 1) * 2}`}>
                <p className="text-7xl font-bold text-[#1d7c5f]/10 leading-none mb-4">
                  {s.num}
                </p>
                <div className="w-16 h-16 bg-[#1d7c5f] rounded-2xl flex items-center justify-center mb-6 relative z-10 hover-scale">
                  <Image src={s.icon} alt="" width={32} height={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3">{s.title}</h3>
                <p className="text-base text-[#6a707a] leading-relaxed">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WhatsApp Section ── */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-br from-[#14634c] via-[#1d7c5f] to-[#14634c]">
        <div className="absolute top-10 right-0 w-96 h-96 rounded-full bg-white/5 blur-[64px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 rounded-full bg-[#25d366]/10 blur-[64px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative">
          {/* Left */}
          <Reveal animation="animate-slide-left">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
              <Image src="/landing/icon-whatsapp-tag.svg" alt="" width={18} height={18} />
              <span className="text-sm font-medium text-white">
                Integration WhatsApp
              </span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Vos clients commandent sur WhatsApp
            </h2>

            <p className="text-xl text-white/80 leading-relaxed mb-10 max-w-lg">
              L&apos;application preferee de vos clients devient votre canal de vente.
              Recevez et gerez toutes vos commandes en un seul endroit.
            </p>

            <div className="space-y-4">
              {[
                "Notifications instantanees pour chaque commande",
                "Repondez directement depuis l'application",
                "Historique complet de toutes les conversations",
                "Aucune installation requise pour vos clients",
              ].map((t, i) => (
                <Reveal key={t} animation="animate-fade-up" delay={`stagger-${i + 1}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Image src="/landing/icon-check-wa.svg" alt="" width={16} height={16} />
                    </span>
                    <span className="text-base text-white/90">{t}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* Right — Chat Mock */}
          <Reveal animation="animate-slide-right" delay="stagger-2">
            <div className="bg-white rounded-3xl p-6 shadow-2xl hover-glow transition-shadow duration-500">
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-[#dde0e4] pb-4 mb-4">
                <div className="w-12 h-12 bg-[#25d366] rounded-full flex items-center justify-center">
                  <Image src="/landing/icon-wa-phone.svg" alt="" width={24} height={24} />
                </div>
                <div>
                  <p className="font-medium">Ma Boutique</p>
                  <p className="text-sm text-[#6a707a]">WhatsApp Business</p>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f6f7f7] shrink-0" />
                  <div className="bg-[#f6f7f7] rounded-2xl rounded-tl-none px-4 py-3 max-w-[75%]">
                    <p className="text-sm">Bonjour, je voudrais commander 2 sacs de riz</p>
                    <p className="text-xs text-[#6a707a] mt-1">10:30</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="bg-[#1d7c5f] rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-white">
                      Parfait ! C&apos;est 5000 FCFA le sac. Total: 10,000 FCFA. Je confirme votre commande ?
                    </p>
                    <p className="text-xs text-white/70 text-right mt-1">10:31 ✓✓</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f6f7f7] shrink-0" />
                  <div className="bg-[#f6f7f7] rounded-2xl rounded-tl-none px-4 py-3">
                    <p className="text-sm">Oui, c&apos;est bon !</p>
                    <p className="text-xs text-[#6a707a] mt-1">10:32</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="bg-[#1d7c5f] rounded-2xl rounded-tr-none px-4 py-3 max-w-[75%]">
                    <p className="text-sm text-white">
                      ✅ Commande confirmee ! Livraison demain matin
                    </p>
                    <p className="text-xs text-white/70 text-right mt-1">10:33 ✓✓</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Testimonials Carousel ── */}
      <TestimonialCarousel />

      {/* ── Final CTA ── */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-br from-[#faf9f7] via-[#f5f9f7] to-[#faf9f7]">
        <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-[#daf2e9]/40 blur-[64px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 rounded-full bg-[#1d7c5f]/10 blur-[64px] pointer-events-none" />

        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <Reveal animation="animate-fade-up">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Pret a developper votre commerce ?
            </h2>
            <p className="text-xl text-[#6a707a] mb-10">
              Rejoignez des milliers de commercants qui utilisent BizManager pour
              vendre plus et mieux.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/login"
                className="bg-[#1d7c5f] text-white px-8 py-4 rounded-2xl font-medium text-base flex items-center justify-center gap-2 hover:bg-[#14634c] shadow-lg shadow-[#1d7c5f]/20 hover-scale active-press transition-all duration-200"
              >
                Commencer gratuitement
                <Image src="/landing/icon-arrow.svg" alt="" width={20} height={20} />
              </Link>
              <Link
                href="/shop/bizmanager-douala"
                className="bg-white border border-[#dde0e4] px-8 py-4 rounded-2xl font-medium text-base flex items-center justify-center gap-2 hover:bg-[#f6f7f7] hover-scale active-press transition-all duration-200"
              >
                <Image src="/landing/icon-download.svg" alt="" width={20} height={20} />
                Telecharger l&apos;app
              </Link>
            </div>

            <p className="text-sm text-[#6a707a]">
              Aucune carte de credit requise &bull; Gratuit pendant 30 jours
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#e8e6e3] bg-gradient-to-b from-white to-[#f9fdfc] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 bg-[#1d7c5f] rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                  BM
                </span>
                <span className="text-xl font-bold">BizManager</span>
              </div>
              <p className="text-base text-[#6a707a] leading-relaxed max-w-sm mb-6">
                La plateforme SaaS qui aide les petits commercants d&apos;Afrique
                francophone a vendre en ligne depuis leur telephone.
              </p>
              <div className="flex gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-10 h-10 bg-[#f6f7f7] rounded-xl flex items-center justify-center hover-scale cursor-pointer">
                    <div className="w-5 h-5 bg-[#20232b]/60 rounded-sm" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4">Produit</h4>
              <ul className="space-y-3">
                <li><Link href="#features" className="text-[#6a707a] hover:text-[#1d7c5f] transition-colors duration-200">Fonctionnalites</Link></li>
                <li><a href="#" className="text-[#6a707a] hover:text-[#1d7c5f] transition-colors duration-200">Tarifs</a></li>
                <li><Link href="/shop/bizmanager-douala" className="text-[#6a707a] hover:text-[#1d7c5f] transition-colors duration-200">Demo</Link></li>
                <li><a href="#" className="text-[#6a707a] hover:text-[#1d7c5f] transition-colors duration-200">Telecharger l&apos;app</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Ressources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-[#6a707a] hover:text-[#1d7c5f] transition-colors duration-200">Blog</a></li>
                <li><a href="#" className="text-[#6a707a] hover:text-[#1d7c5f] transition-colors duration-200">Guides</a></li>
                <li><a href="#" className="text-[#6a707a] hover:text-[#1d7c5f] transition-colors duration-200">Support</a></li>
                <li><a href="#" className="text-[#6a707a] hover:text-[#1d7c5f] transition-colors duration-200">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-[#6a707a] hover:text-[#1d7c5f] transition-colors duration-200">Confidentialite</a></li>
                <li><a href="#" className="text-[#6a707a] hover:text-[#1d7c5f] transition-colors duration-200">Conditions</a></li>
                <li><a href="#" className="text-[#6a707a] hover:text-[#1d7c5f] transition-colors duration-200">Cookies</a></li>
                <li><a href="#" className="text-[#6a707a] hover:text-[#1d7c5f] transition-colors duration-200">Licences</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#e8e6e3] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#6a707a]">
              &copy; {new Date().getFullYear()} BizManager. Tous droits reserves.
            </p>
            <div className="flex gap-6 text-sm text-[#6a707a]">
              <span>Cameroun</span>
              <span className="text-[#e8e6e3]">&bull;</span>
              <span>Senegal</span>
              <span className="text-[#e8e6e3]">&bull;</span>
              <span>Cote d&apos;Ivoire</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
