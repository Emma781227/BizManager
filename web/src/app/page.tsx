import React from "react";

const LP_CSS = `
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

.lp-container { max-width: 1320px; margin: 0 auto; padding: 0 24px; }

.lp-header { background: #fff; border-bottom: 1px solid #E8ECEA; position: sticky; top: 0; z-index: 100; }
.lp-header-inner { max-width: 1320px; margin: 0 auto; padding: 0 24px; height: 72px; display: flex; align-items: center; justify-content: space-between; }
.lp-nav { display: flex; gap: 32px; }
.lp-nav a { font-size: 14px; font-weight: 500; color: #667085; text-decoration: none; transition: color 0.15s; }
.lp-nav a:hover { color: #0A8F45; }
.lp-header-btns { display: flex; gap: 10px; }

.lp-hero { display: grid; grid-template-columns: 500px 1fr; gap: 48px; align-items: center; padding: 72px 0 80px; }

.lp-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }

.lp-features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

.lp-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

.lp-previews { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

.lp-testimonials { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

.lp-pricing { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

.lp-footer-grid { display: grid; grid-template-columns: 280px 1fr 1fr 1fr; gap: 40px; }

@media (max-width: 1024px) {
  .lp-hero { grid-template-columns: 1fr; gap: 40px; }
  .lp-features-grid { grid-template-columns: repeat(2, 1fr); }
  .lp-previews { grid-template-columns: 1fr; }
  .lp-footer-grid { grid-template-columns: 1fr 1fr; gap: 28px; }
}
@media (max-width: 768px) {
  .lp-nav { display: none; }
  .lp-stats { grid-template-columns: 1fr; }
  .lp-steps { grid-template-columns: 1fr; }
  .lp-testimonials { grid-template-columns: 1fr; }
  .lp-pricing { grid-template-columns: 1fr; }
  .lp-footer-grid { grid-template-columns: 1fr; }
  .lp-features-grid { grid-template-columns: 1fr 1fr; }
  .lp-hero-btns { flex-direction: column; }
  .lp-hero-btns a { text-align: center; }
}
@media (max-width: 480px) {
  .lp-features-grid { grid-template-columns: 1fr; }
  .lp-header-inner { padding: 0 14px; height: 60px; }
  .lp-header-btns { gap: 6px; }
  .lp-header-btns a { padding: 8px 12px !important; font-size: 12px !important; border-radius: 8px !important; }
  .lp-logo-text { display: none; }
}
`;

const btnGreen = {
  background: "#0A8F45",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 24px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
  lineHeight: 1.3,
} as React.CSSProperties;

const btnOutline = {
  background: "#fff",
  color: "#1F2A24",
  border: "1.5px solid #E8ECEA",
  borderRadius: 12,
  padding: "12px 22px",
  fontSize: 15,
  fontWeight: 500,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
  lineHeight: 1.3,
} as React.CSSProperties;

const card = {
  background: "#fff",
  border: "1.5px solid #E8ECEA",
  borderRadius: 18,
  boxShadow: "0 2px 12px rgba(16,24,40,0.06)",
} as React.CSSProperties;

export default function HomePage() {
  return (
    <>
      <style>{LP_CSS}</style>
      <div style={{ background: "#F8FAF9", minHeight: "100vh" }}>

        {/* ── 1. Header ── */}
        <header className="lp-header">
          <div className="lp-header-inner">
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#0A8F45", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>BM</div>
              <span className="lp-logo-text" style={{ fontSize: 17, fontWeight: 700, color: "#1F2A24" }}>BizManager</span>
            </a>
            <nav className="lp-nav">
              <a href="#features">Fonctionnalités</a>
              <a href="#how">Comment ça marche</a>
              <a href="#pricing">Tarifs</a>
              <a href="#faq">FAQ</a>
            </nav>
            <div className="lp-header-btns">
              <a href="/login" className="lp-btn-secondary" style={btnOutline}>Se connecter</a>
              <a href="/register" style={{ ...btnGreen, padding: "10px 20px", fontSize: 14 }}>Commencer</a>
            </div>
          </div>
        </header>

        {/* ── 2. Hero ── */}
        <section style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="lp-container">
            <div className="lp-hero">
              {/* Left column — text */}
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#EAF7EF", border: "1px solid #B6E8CC", borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 600, color: "#0A8F45", marginBottom: 24 }}>
                  Gestion de boutique · WhatsApp · Paiements
                </div>
                <h1 style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.1, color: "#1F2A24", margin: 0 }}>
                  Gérez votre boutique simplement.
                </h1>
                <p style={{ fontSize: 19, color: "#667085", marginTop: 20, lineHeight: 1.6, marginBottom: 0 }}>
                  BizManager aide les commerçants à gérer produits, commandes, clients et paiements — tout depuis un seul endroit.
                </p>
                <div className="lp-hero-btns" style={{ marginTop: 32, display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <a href="/register" style={{ ...btnGreen, padding: "14px 28px", fontSize: 16 }}>
                    Créer ma boutique →
                  </a>
                  <a href="#how" style={{ ...btnOutline, padding: "14px 28px", fontSize: 16 }}>
                    Voir comment ça marche
                  </a>
                </div>
                <p style={{ marginTop: 20, fontSize: 13, color: "#98A2B3", marginBottom: 0 }}>
                  ✓ Gratuit pour démarrer  ·  ✓ Sans carte bancaire  ·  ✓ En français
                </p>
              </div>

              {/* Right column — Laptop + Phone mockup */}
              <div style={{ position: "relative", width: "100%", maxWidth: 780, marginLeft: "auto" }}>
                {/* Laptop SVG */}
                <svg viewBox="0 0 780 460" style={{ width: "100%", height: "auto" }} xmlns="http://www.w3.org/2000/svg">
                  {/* Laptop body */}
                  <rect x="0" y="0" width="780" height="440" rx="16" fill="#1F2A24" />
                  {/* Screen area */}
                  <rect x="12" y="10" width="756" height="400" rx="8" fill="#F8FAF9" />
                  {/* Keyboard bar */}
                  <rect x="0" y="440" width="780" height="20" rx="4" fill="#2D3B35" />
                  {/* Hinge */}
                  <rect x="340" y="440" width="100" height="4" fill="#3D4B45" />

                  {/* ── Sidebar ── */}
                  <rect x="24" y="20" width="140" height="380" rx="6" fill="#1F2A24" />
                  {/* Logo icon in sidebar */}
                  <rect x="34" y="30" width="30" height="30" rx="8" fill="#0A8F45" />
                  <text x="49" y="51" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800">BM</text>
                  {/* Nav item 1 — active */}
                  <rect x="30" y="74" width="120" height="28" rx="6" fill="#0A8F45" fillOpacity="0.25" />
                  <rect x="38" y="81" width="12" height="12" rx="3" fill="#0A8F45" />
                  <rect x="56" y="84" width="64" height="7" rx="3" fill="#0A8F45" />
                  {/* Nav item 2 */}
                  <rect x="38" y="115" width="12" height="12" rx="3" fill="#3D4B45" />
                  <rect x="56" y="118" width="56" height="7" rx="3" fill="#3D4B45" />
                  {/* Nav item 3 */}
                  <rect x="38" y="141" width="12" height="12" rx="3" fill="#3D4B45" />
                  <rect x="56" y="144" width="48" height="7" rx="3" fill="#3D4B45" />
                  {/* Nav item 4 */}
                  <rect x="38" y="167" width="12" height="12" rx="3" fill="#3D4B45" />
                  <rect x="56" y="170" width="60" height="7" rx="3" fill="#3D4B45" />
                  {/* Nav item 5 */}
                  <rect x="38" y="193" width="12" height="12" rx="3" fill="#3D4B45" />
                  <rect x="56" y="196" width="52" height="7" rx="3" fill="#3D4B45" />
                  {/* Divider */}
                  <rect x="34" y="222" width="112" height="1" fill="#2D3B35" />
                  {/* Nav item 6 */}
                  <rect x="38" y="232" width="12" height="12" rx="3" fill="#3D4B45" />
                  <rect x="56" y="235" width="44" height="7" rx="3" fill="#3D4B45" />
                  {/* User avatar at bottom */}
                  <circle cx="44" cy="374" r="14" fill="#0A8F45" fillOpacity="0.4" />
                  <rect x="64" y="368" width="50" height="6" rx="3" fill="#3D4B45" />
                  <rect x="64" y="378" width="36" height="5" rx="2.5" fill="#2D3B35" />

                  {/* ── Main area ── */}
                  {/* Top bar */}
                  <rect x="176" y="20" width="580" height="38" rx="6" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                  <rect x="188" y="31" width="80" height="8" rx="4" fill="#E8ECEA" />
                  <rect x="286" y="31" width="60" height="8" rx="4" fill="#E8ECEA" />
                  <circle cx="720" cy="35" r="12" fill="#EAF7EF" />
                  <rect x="714" y="31" width="12" height="8" rx="3" fill="#0A8F45" fillOpacity="0.5" />
                  <circle cx="745" cy="35" r="8" fill="#F0F0F0" />

                  {/* KPI Cards row */}
                  {/* Card 1 */}
                  <rect x="176" y="68" width="183" height="64" rx="8" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                  <circle cx="198" cy="86" r="8" fill="#EAF7EF" />
                  <rect x="210" y="82" width="60" height="7" rx="3" fill="#E8ECEA" />
                  <rect x="186" y="103" width="80" height="12" rx="4" fill="#1F2A24" fillOpacity="0.15" />
                  <rect x="274" y="105" width="40" height="8" rx="3" fill="#0A8F45" fillOpacity="0.4" />

                  {/* Card 2 */}
                  <rect x="367" y="68" width="183" height="64" rx="8" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                  <circle cx="389" cy="86" r="8" fill="#FFF4E0" />
                  <rect x="401" y="82" width="60" height="7" rx="3" fill="#E8ECEA" />
                  <rect x="377" y="103" width="80" height="12" rx="4" fill="#1F2A24" fillOpacity="0.15" />
                  <rect x="465" y="105" width="40" height="8" rx="3" fill="#D18F17" fillOpacity="0.5" />

                  {/* Card 3 */}
                  <rect x="558" y="68" width="198" height="64" rx="8" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                  <circle cx="580" cy="86" r="8" fill="#E8F0FE" />
                  <rect x="592" y="82" width="60" height="7" rx="3" fill="#E8ECEA" />
                  <rect x="568" y="103" width="80" height="12" rx="4" fill="#1F2A24" fillOpacity="0.15" />
                  <rect x="656" y="105" width="40" height="8" rx="3" fill="#4A90D9" fillOpacity="0.5" />

                  {/* Chart area */}
                  <rect x="176" y="142" width="380" height="130" rx="8" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                  {/* Chart title stub */}
                  <rect x="188" y="154" width="90" height="8" rx="4" fill="#E8ECEA" />
                  <rect x="286" y="154" width="50" height="8" rx="4" fill="#EAF7EF" />
                  {/* Grid lines */}
                  <line x1="188" y1="240" x2="544" y2="240" stroke="#F0F2F1" strokeWidth="1" />
                  <line x1="188" y1="220" x2="544" y2="220" stroke="#F0F2F1" strokeWidth="1" />
                  <line x1="188" y1="200" x2="544" y2="200" stroke="#F0F2F1" strokeWidth="1" />
                  <line x1="188" y1="180" x2="544" y2="180" stroke="#F0F2F1" strokeWidth="1" />
                  {/* Bars */}
                  <rect x="210" y="210" width="36" height="30" rx="4" fill="#DDF6E7" />
                  <rect x="268" y="195" width="36" height="45" rx="4" fill="#DDF6E7" />
                  <rect x="326" y="175" width="36" height="65" rx="4" fill="#0A8F45" />
                  <rect x="384" y="205" width="36" height="35" rx="4" fill="#DDF6E7" />
                  <rect x="442" y="188" width="36" height="52" rx="4" fill="#DDF6E7" />
                  {/* X axis labels */}
                  <rect x="210" y="245" width="30" height="5" rx="2" fill="#E8ECEA" />
                  <rect x="268" y="245" width="30" height="5" rx="2" fill="#E8ECEA" />
                  <rect x="326" y="245" width="30" height="5" rx="2" fill="#E8ECEA" />
                  <rect x="384" y="245" width="30" height="5" rx="2" fill="#E8ECEA" />
                  <rect x="442" y="245" width="30" height="5" rx="2" fill="#E8ECEA" />

                  {/* Side mini chart */}
                  <rect x="566" y="142" width="190" height="130" rx="8" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                  <rect x="578" y="154" width="70" height="8" rx="4" fill="#E8ECEA" />
                  {/* Donut-like chart placeholder */}
                  <circle cx="653" cy="210" r="36" fill="none" stroke="#EAF7EF" strokeWidth="14" />
                  <circle cx="653" cy="210" r="36" fill="none" stroke="#0A8F45" strokeWidth="14" strokeDasharray="113 113" strokeDashoffset="28" transform="rotate(-90 653 210)" />
                  <rect x="638" y="205" width="30" height="10" rx="4" fill="#1F2A24" fillOpacity="0.15" />

                  {/* Table */}
                  <rect x="176" y="282" width="580" height="104" rx="8" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                  {/* Header row */}
                  <rect x="176" y="282" width="580" height="26" rx="8" fill="#F8FAF9" />
                  <rect x="176" y="296" width="580" height="12" fill="#F8FAF9" />
                  <rect x="188" y="289" width="60" height="6" rx="3" fill="#E8ECEA" />
                  <rect x="300" y="289" width="50" height="6" rx="3" fill="#E8ECEA" />
                  <rect x="420" y="289" width="50" height="6" rx="3" fill="#E8ECEA" />
                  <rect x="540" y="289" width="50" height="6" rx="3" fill="#E8ECEA" />
                  {/* Row 1 */}
                  <rect x="176" y="308" width="580" height="26" fill="#fff" />
                  <rect x="188" y="318" width="70" height="6" rx="3" fill="#1F2A24" fillOpacity="0.2" />
                  <rect x="300" y="318" width="40" height="6" rx="3" fill="#E8ECEA" />
                  <rect x="420" y="316" width="36" height="10" rx="5" fill="#EAF7EF" />
                  <rect x="422" y="319" width="32" height="5" rx="2" fill="#0A8F45" fillOpacity="0.6" />
                  <rect x="540" y="318" width="50" height="6" rx="3" fill="#E8ECEA" />
                  {/* Row 2 */}
                  <rect x="176" y="334" width="580" height="26" fill="#FAFCFB" />
                  <rect x="188" y="344" width="56" height="6" rx="3" fill="#1F2A24" fillOpacity="0.2" />
                  <rect x="300" y="344" width="44" height="6" rx="3" fill="#E8ECEA" />
                  <rect x="420" y="342" width="36" height="10" rx="5" fill="#FFF4E0" />
                  <rect x="422" y="345" width="32" height="5" rx="2" fill="#D18F17" fillOpacity="0.6" />
                  <rect x="540" y="344" width="50" height="6" rx="3" fill="#E8ECEA" />
                  {/* Row 3 */}
                  <rect x="176" y="360" width="580" height="26" fill="#fff" />
                  <rect x="188" y="370" width="64" height="6" rx="3" fill="#1F2A24" fillOpacity="0.2" />
                  <rect x="300" y="370" width="36" height="6" rx="3" fill="#E8ECEA" />
                  <rect x="420" y="368" width="36" height="10" rx="5" fill="#EAF7EF" />
                  <rect x="422" y="371" width="32" height="5" rx="2" fill="#0A8F45" fillOpacity="0.6" />
                  <rect x="540" y="370" width="50" height="6" rx="3" fill="#E8ECEA" />
                </svg>

                {/* Phone mockup overlapping */}
                <div style={{ position: "absolute", right: -20, bottom: 0 }}>
                  <svg viewBox="0 0 160 300" width={150} height={280} xmlns="http://www.w3.org/2000/svg">
                    {/* Phone body */}
                    <rect x="0" y="0" width="160" height="300" rx="24" fill="#1F2A24" />
                    {/* Screen */}
                    <rect x="8" y="20" width="144" height="262" rx="18" fill="#F8FAF9" />
                    {/* Notch */}
                    <rect x="55" y="20" width="50" height="16" rx="8" fill="#1F2A24" />
                    {/* Header bar */}
                    <rect x="8" y="40" width="144" height="34" rx="0" fill="#0A8F45" />
                    <rect x="8" y="58" width="144" height="16" fill="#0A8F45" />
                    <rect x="18" y="48" width="50" height="7" rx="3" fill="#fff" fillOpacity="0.7" />
                    <circle cx="138" cy="52" r="8" fill="#08763A" />
                    {/* Product card 1 */}
                    <rect x="12" y="82" width="136" height="76" rx="10" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                    <rect x="12" y="82" width="136" height="36" rx="10" fill="#EAF7EF" />
                    <rect x="12" y="100" width="136" height="18" fill="#EAF7EF" />
                    {/* Product image placeholder icon */}
                    <rect x="56" y="88" width="48" height="24" rx="4" fill="#0A8F45" fillOpacity="0.2" />
                    <circle cx="80" cy="98" r="6" fill="#0A8F45" fillOpacity="0.3" />
                    {/* Product name */}
                    <rect x="22" y="126" width="70" height="7" rx="3" fill="#1F2A24" fillOpacity="0.25" />
                    {/* Price */}
                    <rect x="22" y="139" width="50" height="7" rx="3" fill="#0A8F45" fillOpacity="0.5" />
                    {/* Cart button */}
                    <rect x="108" y="133" width="32" height="16" rx="8" fill="#0A8F45" />
                    <text x="124" y="144" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700">+</text>
                    {/* Product card 2 */}
                    <rect x="12" y="168" width="136" height="76" rx="10" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                    <rect x="12" y="168" width="136" height="36" rx="10" fill="#FFF4E0" />
                    <rect x="12" y="186" width="136" height="18" fill="#FFF4E0" />
                    <rect x="56" y="174" width="48" height="24" rx="4" fill="#D18F17" fillOpacity="0.2" />
                    <circle cx="80" cy="184" r="6" fill="#D18F17" fillOpacity="0.3" />
                    <rect x="22" y="212" width="60" height="7" rx="3" fill="#1F2A24" fillOpacity="0.25" />
                    <rect x="22" y="225" width="44" height="7" rx="3" fill="#0A8F45" fillOpacity="0.5" />
                    <rect x="108" y="219" width="32" height="16" rx="8" fill="#0A8F45" />
                    <text x="124" y="230" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700">+</text>
                    {/* Add to cart button bottom */}
                    <rect x="12" y="256" width="136" height="22" rx="8" fill="#0A8F45" />
                    <rect x="42" y="263" width="76" height="7" rx="3" fill="#fff" fillOpacity="0.8" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Stats ── */}
        <section id="stats" style={{ marginTop: 0, background: "#fff", borderTop: "1.5px solid #E8ECEA", borderBottom: "1.5px solid #E8ECEA" }}>
          <div className="lp-container">
            <div className="lp-stats" style={{ padding: "28px 0" }}>
              <div style={{ borderRight: "1.5px solid #E8ECEA", padding: "0 40px", textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#0A8F45" }}>5 000+</div>
                <div style={{ fontSize: 14, color: "#667085", marginTop: 4 }}>Boutiques créées</div>
              </div>
              <div style={{ borderRight: "1.5px solid #E8ECEA", padding: "0 40px", textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#0A8F45" }}>120 000+</div>
                <div style={{ fontSize: 14, color: "#667085", marginTop: 4 }}>Commandes gérées</div>
              </div>
              <div style={{ padding: "0 40px", textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#0A8F45" }}>30 000+</div>
                <div style={{ fontSize: 14, color: "#667085", marginTop: 4 }}>Clients satisfaits</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Features ── */}
        <section id="features" style={{ marginTop: 60, paddingBottom: 0 }}>
          <div className="lp-container">
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 style={{ fontSize: 38, fontWeight: 800, color: "#1F2A24", margin: 0 }}>Tout ce qu&apos;il vous faut</h2>
              <p style={{ fontSize: 17, color: "#667085", marginTop: 10, marginBottom: 0 }}>Une plateforme complète pour les commerçants modernes.</p>
            </div>
            <div className="lp-features-grid">
              <div style={{ ...card, padding: 28 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EAF7EF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 16 }}>🏪</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1F2A24", margin: "0 0 8px 0" }}>Gestion de boutique</h3>
                <p style={{ fontSize: 14, color: "#667085", lineHeight: 1.6, margin: 0 }}>Créez votre boutique en ligne, gérez votre catalogue et partagez facilement avec vos clients.</p>
              </div>
              <div style={{ ...card, padding: 28 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EAF7EF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 16 }}>📦</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1F2A24", margin: "0 0 8px 0" }}>Commandes</h3>
                <p style={{ fontSize: 14, color: "#667085", lineHeight: 1.6, margin: 0 }}>Suivez chaque commande de A à Z : création, confirmation, préparation, livraison.</p>
              </div>
              <div style={{ ...card, padding: 28 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EAF7EF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 16 }}>💳</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1F2A24", margin: "0 0 8px 0" }}>Paiements</h3>
                <p style={{ fontSize: 14, color: "#667085", lineHeight: 1.6, margin: 0 }}>Enregistrez les paiements, suivez les impayés et gérez plusieurs modes de règlement.</p>
              </div>
              <div style={{ ...card, padding: 28 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EAF7EF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 16 }}>📱</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1F2A24", margin: "0 0 8px 0" }}>WhatsApp Business</h3>
                <p style={{ fontSize: 14, color: "#667085", lineHeight: 1.6, margin: 0 }}>Partagez votre boutique et communiquez avec vos clients directement via WhatsApp.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. How it works ── */}
        <section id="how" style={{ marginTop: 60 }}>
          <div className="lp-container">
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 style={{ fontSize: 38, fontWeight: 800, color: "#1F2A24", margin: 0 }}>Comment ça marche ?</h2>
              <p style={{ fontSize: 17, color: "#667085", marginTop: 10, marginBottom: 0 }}>En moins de 5 minutes, votre boutique est prête.</p>
            </div>
            <div className="lp-steps">
              <div style={{ ...card, padding: 28 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#0A8F45", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, marginBottom: 20 }}>1</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1F2A24", margin: "0 0 10px 0" }}>Créez votre compte</h3>
                <p style={{ fontSize: 14, color: "#667085", lineHeight: 1.6, margin: 0 }}>Inscrivez-vous gratuitement et configurez votre boutique en quelques clics.</p>
              </div>
              <div style={{ ...card, padding: 28 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#0A8F45", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, marginBottom: 20 }}>2</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1F2A24", margin: "0 0 10px 0" }}>Ajoutez vos produits</h3>
                <p style={{ fontSize: 14, color: "#667085", lineHeight: 1.6, margin: 0 }}>Importez votre catalogue, fixez vos prix et activez votre boutique publique.</p>
              </div>
              <div style={{ ...card, padding: 28 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#0A8F45", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, marginBottom: 20 }}>3</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1F2A24", margin: "0 0 10px 0" }}>Recevez vos commandes</h3>
                <p style={{ fontSize: 14, color: "#667085", lineHeight: 1.6, margin: 0 }}>Vos clients commandent, vous recevez les notifications et gérez tout depuis le dashboard.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Product Previews ── */}
        <section id="product" style={{ marginTop: 60 }}>
          <div className="lp-container">
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 style={{ fontSize: 38, fontWeight: 800, color: "#1F2A24", margin: 0 }}>Découvrez le produit</h2>
              <p style={{ fontSize: 17, color: "#667085", marginTop: 10, marginBottom: 0 }}>Un dashboard marchand complet et une boutique publique moderne.</p>
            </div>
            <div className="lp-previews">
              {/* Dashboard preview */}
              <div style={{ ...card, padding: 24, overflow: "hidden" }}>
                <div style={{ display: "inline-block", background: "#EAF7EF", color: "#0A8F45", fontSize: 12, fontWeight: 600, borderRadius: 999, padding: "4px 12px", marginBottom: 14 }}>Dashboard</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1F2A24", margin: "0 0 8px 0" }}>Votre tableau de bord</h3>
                <p style={{ fontSize: 14, color: "#667085", marginBottom: 20, lineHeight: 1.6, marginTop: 0 }}>Suivez vos ventes, gérez vos commandes et analysez vos performances en temps réel.</p>
                <div style={{ background: "#F8FAF9", borderRadius: 12, height: 220, overflow: "hidden", border: "1px solid #E8ECEA" }}>
                  <svg viewBox="0 0 460 220" style={{ width: "100%", height: "100%" }} xmlns="http://www.w3.org/2000/svg">
                    {/* Mini sidebar */}
                    <rect x="0" y="0" width="70" height="220" fill="#1F2A24" />
                    <rect x="8" y="10" width="24" height="24" rx="6" fill="#0A8F45" />
                    <rect x="10" y="48" width="50" height="18" rx="4" fill="#0A8F45" fillOpacity="0.3" />
                    <rect x="16" y="54" width="38" height="6" rx="3" fill="#0A8F45" />
                    <rect x="16" y="78" width="38" height="6" rx="3" fill="#2D3B35" />
                    <rect x="16" y="96" width="38" height="6" rx="3" fill="#2D3B35" />
                    <rect x="16" y="114" width="38" height="6" rx="3" fill="#2D3B35" />
                    <rect x="16" y="132" width="38" height="6" rx="3" fill="#2D3B35" />
                    {/* Main area */}
                    <rect x="70" y="0" width="390" height="32" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                    <rect x="80" y="12" width="60" height="8" rx="4" fill="#E8ECEA" />
                    <circle cx="440" cy="16" r="10" fill="#EAF7EF" />
                    {/* KPI row */}
                    <rect x="78" y="40" width="110" height="44" rx="6" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                    <circle cx="92" cy="54" r="6" fill="#EAF7EF" />
                    <rect x="102" y="50" width="50" height="6" rx="3" fill="#E8ECEA" />
                    <rect x="84" y="67" width="60" height="8" rx="4" fill="#1F2A24" fillOpacity="0.2" />
                    <rect x="202" y="40" width="110" height="44" rx="6" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                    <circle cx="216" cy="54" r="6" fill="#FFF4E0" />
                    <rect x="226" y="50" width="50" height="6" rx="3" fill="#E8ECEA" />
                    <rect x="208" y="67" width="60" height="8" rx="4" fill="#1F2A24" fillOpacity="0.2" />
                    <rect x="326" y="40" width="126" height="44" rx="6" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                    <circle cx="340" cy="54" r="6" fill="#E8F0FE" />
                    <rect x="350" y="50" width="50" height="6" rx="3" fill="#E8ECEA" />
                    <rect x="332" y="67" width="60" height="8" rx="4" fill="#1F2A24" fillOpacity="0.2" />
                    {/* Chart */}
                    <rect x="78" y="92" width="220" height="114" rx="6" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                    <rect x="88" y="102" width="60" height="6" rx="3" fill="#E8ECEA" />
                    <line x1="88" y1="178" x2="286" y2="178" stroke="#F0F2F1" strokeWidth="1" />
                    <line x1="88" y1="162" x2="286" y2="162" stroke="#F0F2F1" strokeWidth="1" />
                    <line x1="88" y1="146" x2="286" y2="146" stroke="#F0F2F1" strokeWidth="1" />
                    <rect x="98" y="160" width="20" height="18" rx="3" fill="#DDF6E7" />
                    <rect x="128" y="150" width="20" height="28" rx="3" fill="#DDF6E7" />
                    <rect x="158" y="140" width="20" height="38" rx="3" fill="#0A8F45" />
                    <rect x="188" y="155" width="20" height="23" rx="3" fill="#DDF6E7" />
                    <rect x="218" y="148" width="20" height="30" rx="3" fill="#DDF6E7" />
                    {/* Table */}
                    <rect x="306" y="92" width="146" height="114" rx="6" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                    <rect x="306" y="92" width="146" height="20" rx="6" fill="#F8FAF9" />
                    <rect x="306" y="100" width="146" height="12" fill="#F8FAF9" />
                    <rect x="316" y="98" width="40" height="5" rx="2" fill="#E8ECEA" />
                    <rect x="316" y="120" width="50" height="5" rx="2" fill="#1F2A24" fillOpacity="0.2" />
                    <rect x="380" y="120" width="30" height="5" rx="2" fill="#E8ECEA" />
                    <rect x="316" y="134" width="44" height="5" rx="2" fill="#1F2A24" fillOpacity="0.2" />
                    <rect x="380" y="134" width="30" height="5" rx="2" fill="#E8ECEA" />
                    <rect x="316" y="148" width="48" height="5" rx="2" fill="#1F2A24" fillOpacity="0.2" />
                    <rect x="380" y="148" width="30" height="5" rx="2" fill="#E8ECEA" />
                    <rect x="316" y="162" width="40" height="5" rx="2" fill="#1F2A24" fillOpacity="0.2" />
                    <rect x="380" y="162" width="30" height="5" rx="2" fill="#E8ECEA" />
                    <rect x="316" y="176" width="52" height="5" rx="2" fill="#1F2A24" fillOpacity="0.2" />
                    <rect x="380" y="176" width="30" height="5" rx="2" fill="#E8ECEA" />
                  </svg>
                </div>
              </div>

              {/* Storefront preview */}
              <div style={{ ...card, padding: 24, overflow: "hidden" }}>
                <div style={{ display: "inline-block", background: "#EAF7EF", color: "#0A8F45", fontSize: 12, fontWeight: 600, borderRadius: 999, padding: "4px 12px", marginBottom: 14 }}>Storefront</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1F2A24", margin: "0 0 8px 0" }}>Votre boutique publique</h3>
                <p style={{ fontSize: 14, color: "#667085", marginBottom: 20, lineHeight: 1.6, marginTop: 0 }}>Partagez un lien direct à vos clients. Ils voient vos produits, passent commande, c&apos;est tout.</p>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", height: 220 }}>
                  <div style={{ height: 220, width: 120, background: "#F8FAF9", borderRadius: 20, border: "2px solid #E8ECEA", overflow: "hidden" }}>
                    <svg viewBox="0 0 120 220" style={{ width: "100%", height: "100%" }} xmlns="http://www.w3.org/2000/svg">
                      {/* Phone header */}
                      <rect x="0" y="0" width="120" height="28" fill="#0A8F45" />
                      <rect x="8" y="10" width="44" height="8" rx="4" fill="#fff" fillOpacity="0.7" />
                      <circle cx="106" cy="14" r="8" fill="#08763A" />
                      {/* Product grid */}
                      <rect x="6" y="36" width="50" height="60" rx="8" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                      <rect x="6" y="36" width="50" height="32" rx="8" fill="#EAF7EF" />
                      <rect x="6" y="52" width="50" height="16" fill="#EAF7EF" />
                      <circle cx="31" cy="50" r="8" fill="#0A8F45" fillOpacity="0.25" />
                      <rect x="12" y="76" width="30" height="5" rx="2" fill="#1F2A24" fillOpacity="0.3" />
                      <rect x="12" y="85" width="22" height="5" rx="2" fill="#0A8F45" fillOpacity="0.5" />

                      <rect x="64" y="36" width="50" height="60" rx="8" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                      <rect x="64" y="36" width="50" height="32" rx="8" fill="#FFF4E0" />
                      <rect x="64" y="52" width="50" height="16" fill="#FFF4E0" />
                      <circle cx="89" cy="50" r="8" fill="#D18F17" fillOpacity="0.25" />
                      <rect x="70" y="76" width="30" height="5" rx="2" fill="#1F2A24" fillOpacity="0.3" />
                      <rect x="70" y="85" width="22" height="5" rx="2" fill="#0A8F45" fillOpacity="0.5" />

                      <rect x="6" y="104" width="50" height="60" rx="8" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                      <rect x="6" y="104" width="50" height="32" rx="8" fill="#E8F0FE" />
                      <rect x="6" y="120" width="50" height="16" fill="#E8F0FE" />
                      <circle cx="31" cy="118" r="8" fill="#4A90D9" fillOpacity="0.25" />
                      <rect x="12" y="144" width="30" height="5" rx="2" fill="#1F2A24" fillOpacity="0.3" />
                      <rect x="12" y="153" width="22" height="5" rx="2" fill="#0A8F45" fillOpacity="0.5" />

                      <rect x="64" y="104" width="50" height="60" rx="8" fill="#fff" stroke="#E8ECEA" strokeWidth="1" />
                      <rect x="64" y="104" width="50" height="32" rx="8" fill="#FCE8E8" />
                      <rect x="64" y="120" width="50" height="16" fill="#FCE8E8" />
                      <circle cx="89" cy="118" r="8" fill="#A63B35" fillOpacity="0.2" />
                      <rect x="70" y="144" width="30" height="5" rx="2" fill="#1F2A24" fillOpacity="0.3" />
                      <rect x="70" y="153" width="22" height="5" rx="2" fill="#0A8F45" fillOpacity="0.5" />

                      {/* CTA button */}
                      <rect x="6" y="174" width="108" height="28" rx="8" fill="#0A8F45" />
                      <rect x="28" y="185" width="64" height="7" rx="3" fill="#fff" fillOpacity="0.85" />
                      {/* Bottom bar */}
                      <rect x="0" y="206" width="120" height="14" fill="#F0F2F1" />
                      <rect x="42" y="209" width="36" height="5" rx="2" fill="#E8ECEA" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. Testimonials ── */}
        <section id="testimonials" style={{ marginTop: 60 }}>
          <div className="lp-container">
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 style={{ fontSize: 38, fontWeight: 800, color: "#1F2A24", margin: 0 }}>Ils nous font confiance</h2>
              <p style={{ fontSize: 15, color: "#F08A24", marginTop: 8, marginBottom: 0 }}>★★★★★  4.9/5 sur 300+ avis</p>
            </div>
            <div className="lp-testimonials">
              <div style={{ ...card, padding: 24 }}>
                <div style={{ color: "#F08A24", fontSize: 13, marginBottom: 14 }}>★★★★★</div>
                <p style={{ fontSize: 14, color: "#1F2A24", lineHeight: 1.7, fontStyle: "italic", margin: "0 0 20px 0" }}>
                  &quot;BizManager m&apos;a permis de gérer mes 50 commandes quotidiennes sans stress. Indispensable !&quot;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#DDF6E7", color: "#0A8F45", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>AD</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2A24" }}>Awa Diallo</div>
                    <div style={{ fontSize: 12, color: "#98A2B3", marginTop: 2 }}>Boutique de vêtements · Dakar</div>
                  </div>
                </div>
              </div>
              <div style={{ ...card, padding: 24 }}>
                <div style={{ color: "#F08A24", fontSize: 13, marginBottom: 14 }}>★★★★★</div>
                <p style={{ fontSize: 14, color: "#1F2A24", lineHeight: 1.7, fontStyle: "italic", margin: "0 0 20px 0" }}>
                  &quot;Je partage mon lien WhatsApp et mes clients commandent directement. C&apos;est magique.&quot;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#DDF6E7", color: "#0A8F45", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>KT</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2A24" }}>Kofi Tano</div>
                    <div style={{ fontSize: 12, color: "#98A2B3", marginTop: 2 }}>Électronique · Abidjan</div>
                  </div>
                </div>
              </div>
              <div style={{ ...card, padding: 24 }}>
                <div style={{ color: "#F08A24", fontSize: 13, marginBottom: 14 }}>★★★★★</div>
                <p style={{ fontSize: 14, color: "#1F2A24", lineHeight: 1.7, fontStyle: "italic", margin: "0 0 20px 0" }}>
                  &quot;Les rapports de ventes m&apos;aident à prendre les bonnes décisions chaque semaine.&quot;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#DDF6E7", color: "#0A8F45", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>FM</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2A24" }}>Fatou Mbaye</div>
                    <div style={{ fontSize: 12, color: "#98A2B3", marginTop: 2 }}>Cosmétiques · Yaoundé</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. Pricing ── */}
        <section id="pricing" style={{ marginTop: 60 }}>
          <div className="lp-container">
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 style={{ fontSize: 38, fontWeight: 800, color: "#1F2A24", margin: 0 }}>Choisissez votre plan</h2>
              <p style={{ fontSize: 17, color: "#667085", marginTop: 10, marginBottom: 0 }}>Démarrez gratuitement, évoluez quand vous en avez besoin.</p>
            </div>
            <div className="lp-pricing">
              {/* Starter */}
              <div style={{ ...card, padding: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#667085", marginBottom: 16 }}>Starter</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 42, fontWeight: 800, color: "#1F2A24", lineHeight: 1 }}>0 FCFA</span>
                  <span style={{ fontSize: 14, color: "#667085", marginBottom: 4 }}>/mois</span>
                </div>
                <p style={{ fontSize: 14, color: "#667085", marginTop: 0, marginBottom: 0 }}>Pour commencer à zéro</p>
                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { text: "1 boutique", ok: true },
                    { text: "20 produits", ok: true },
                    { text: "Commandes illimitées", ok: true },
                    { text: "Partage WhatsApp", ok: true },
                    { text: "Analytics avancés", ok: false },
                    { text: "Support prioritaire", ok: false },
                  ].map((item) => (
                    <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: item.ok ? "#0A8F45" : "#D0D5DD", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{item.ok ? "✓" : "✗"}</span>
                      <span style={{ fontSize: 14, color: "#667085" }}>{item.text}</span>
                    </div>
                  ))}
                </div>
                <a href="/register?plan=starter" style={{ ...btnOutline, width: "100%", textAlign: "center", marginTop: 24, display: "block" }}>
                  Commencer gratuitement
                </a>
              </div>

              {/* Business — Featured */}
              <div style={{ background: "#fff", border: "2px solid #0A8F45", borderRadius: 20, padding: 28, position: "relative", boxShadow: "0 8px 32px rgba(10,143,69,0.14)" }}>
                <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#0A8F45", color: "#fff", fontSize: 12, fontWeight: 600, borderRadius: 999, padding: "4px 16px", whiteSpace: "nowrap" }}>
                  Le plus populaire
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0A8F45", marginBottom: 16 }}>Business</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 42, fontWeight: 800, color: "#1F2A24", lineHeight: 1 }}>4 500 FCFA</span>
                  <span style={{ fontSize: 14, color: "#667085", marginBottom: 4 }}>/mois</span>
                </div>
                <p style={{ fontSize: 14, color: "#667085", marginTop: 0, marginBottom: 0 }}>Pour les boutiques en croissance</p>
                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "3 boutiques",
                    "500 produits",
                    "Commandes illimitées",
                    "Analytics complets",
                    "Gestion clients",
                    "Support prioritaire",
                  ].map((text) => (
                    <div key={text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#0A8F45", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 14, color: "#667085" }}>{text}</span>
                    </div>
                  ))}
                </div>
                <a href="/register?plan=business" style={{ ...btnGreen, width: "100%", textAlign: "center", marginTop: 24, display: "block" }}>
                  Choisir Business
                </a>
              </div>

              {/* Premium */}
              <div style={{ ...card, padding: 28 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#667085", marginBottom: 16 }}>Premium</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 42, fontWeight: 800, color: "#1F2A24", lineHeight: 1 }}>10 000 FCFA</span>
                  <span style={{ fontSize: 14, color: "#667085", marginBottom: 4 }}>/mois</span>
                </div>
                <p style={{ fontSize: 14, color: "#667085", marginTop: 0, marginBottom: 0 }}>Pour les pros multi-boutiques</p>
                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Boutiques illimitées",
                    "Tout Business inclus",
                    "API access",
                    "Rapports personnalisés",
                    "Manager dédié",
                    "Onboarding guidé",
                  ].map((text) => (
                    <div key={text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#0A8F45", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 14, color: "#667085" }}>{text}</span>
                    </div>
                  ))}
                </div>
                <a href="/register?plan=premium" style={{ ...btnOutline, width: "100%", textAlign: "center", marginTop: 24, display: "block" }}>
                  Choisir Premium
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── 9. CTA Final ── */}
        <section style={{ marginTop: 48 }}>
          <div className="lp-container">
            <div style={{ background: "linear-gradient(135deg, #0A8F45 0%, #08763A 100%)", borderRadius: 20, padding: "48px 56px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
              <div>
                <h2 style={{ fontSize: 30, fontWeight: 800, color: "#fff", margin: 0 }}>Prêt à lancer votre boutique ?</h2>
                <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", marginTop: 8, marginBottom: 0 }}>Rejoignez 5 000+ commerçants qui gèrent leur activité avec BizManager.</p>
              </div>
              <a href="/register" style={{ background: "#fff", color: "#0A8F45", borderRadius: 12, padding: "14px 32px", fontSize: 16, fontWeight: 700, textDecoration: "none", display: "inline-block", whiteSpace: "nowrap" }}>
                Commencer gratuitement →
              </a>
            </div>
          </div>
        </section>

        {/* ── 10. Footer ── */}
        <footer style={{ marginTop: 32, paddingTop: 40, paddingBottom: 40, borderTop: "1.5px solid #E8ECEA" }}>
          <div className="lp-container">
            <div className="lp-footer-grid">
              {/* Brand */}
              <div>
                <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#0A8F45", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>BM</div>
                  <span style={{ fontSize: 17, fontWeight: 700, color: "#1F2A24" }}>BizManager</span>
                </a>
                <p style={{ fontSize: 13, color: "#667085", marginTop: 12, lineHeight: 1.6, maxWidth: 220, marginBottom: 0 }}>
                  La plateforme de gestion tout-en-un pour les commerçants africains.
                </p>
                <p style={{ fontSize: 12, color: "#98A2B3", marginTop: 16, marginBottom: 0 }}>© 2025 BizManager</p>
              </div>

              {/* Produit */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2A24", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Produit</div>
                {["Fonctionnalités", "Tarifs", "Mises à jour", "Feuille de route"].map((link) => (
                  <a key={link} href="#" style={{ fontSize: 14, color: "#667085", textDecoration: "none", display: "block", marginBottom: 10, lineHeight: 1.6 }}>{link}</a>
                ))}
              </div>

              {/* Ressources */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2A24", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ressources</div>
                {["Documentation", "FAQ", "Blog", "Tutoriels"].map((link) => (
                  <a key={link} href="#" style={{ fontSize: 14, color: "#667085", textDecoration: "none", display: "block", marginBottom: 10, lineHeight: 1.6 }}>{link}</a>
                ))}
              </div>

              {/* Contact */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2A24", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Contact</div>
                {["Support", "Partenaires", "CGU", "Confidentialité"].map((link) => (
                  <a key={link} href="#" style={{ fontSize: 14, color: "#667085", textDecoration: "none", display: "block", marginBottom: 10, lineHeight: 1.6 }}>{link}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
