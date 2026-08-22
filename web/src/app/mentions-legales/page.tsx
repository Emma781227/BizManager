import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Mentions légales | BizManager",
  description: "Mentions légales du site et service BizManager.",
};

const LAST_UPDATED = "21 juillet 2026";

export default function MentionsLegalesPage() {
  return (
    <div style={{ background: "#f6f8f7", minHeight: "100vh" }}>
      <MarketingHeader />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8ECEA", padding: "48px 56px", boxShadow: "0 2px 12px rgba(16,24,40,.05)" }}>

          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1F2A24", margin: "0 0 8px" }}>
            Mentions légales
          </h1>
          <p style={{ fontSize: 14, color: "#98A2B3", margin: "0 0 40px" }}>Dernière mise à jour : {LAST_UPDATED}</p>

          <Section title="1. Éditeur du site">
            <p>BizManager est édité par une société commerciale immatriculée au Cameroun, conformément à l&apos;Acte Uniforme de l&apos;OHADA relatif au Droit Commercial Général (AUDCG), qui impose à tout commerçant et à toute société commerciale l&apos;immatriculation au Registre du Commerce et du Crédit Mobilier (RCCM).</p>
            <div style={{ background: "#F8FAF9", border: "1px solid #E8ECEA", borderRadius: 10, padding: "18px 22px", fontSize: 15, color: "#1F2A24", lineHeight: 2 }}>
              <strong>Nom du service :</strong> BizManager<br />
              <strong>Forme juridique :</strong> <em style={{ color: "#98A2B3" }}>[à compléter : ex. Société à Responsabilité Limitée (SARL) de droit camerounais]</em><br />
              <strong>Siège social :</strong> <em style={{ color: "#98A2B3" }}>[adresse complète à compléter : ville, région, Cameroun]</em><br />
              <strong>RCCM :</strong> <em style={{ color: "#98A2B3" }}>[numéro d&apos;immatriculation au Registre du Commerce et du Crédit Mobilier, ex. RC/DLA/2026/B/xxxx, à compléter]</em><br />
              <strong>NIU :</strong> <em style={{ color: "#98A2B3" }}>[Numéro d&apos;Identifiant Unique délivré par la Direction Générale des Impôts (DGI), à compléter]</em><br />
              <strong>Capital social :</strong> <em style={{ color: "#98A2B3" }}>[à compléter, le cas échéant]</em><br />
              <strong>Site web :</strong> <a href="https://bizmanager.africa">https://bizmanager.africa</a><br />
              <strong>Email de contact :</strong> <a href="mailto:contact@bizmanager.africa">contact@bizmanager.africa</a>
            </div>
          </Section>

          <Section title="2. Directeur de la publication">
            <p>Le directeur de la publication est le représentant légal de l&apos;entité éditrice du service BizManager.</p>
            <p>Pour le contacter : <a href="mailto:contact@bizmanager.africa">contact@bizmanager.africa</a></p>
          </Section>

          <Section title="3. Hébergement">
            <div style={{ background: "#F8FAF9", border: "1px solid #E8ECEA", borderRadius: 10, padding: "18px 22px", fontSize: 15, color: "#1F2A24", lineHeight: 2 }}>
              <strong>Hébergeur principal (application) :</strong><br />
              Vercel Inc.<br />
              440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
              <a href="https://vercel.com">https://vercel.com</a><br />
              <br />
              <strong>Base de données :</strong><br />
              Neon (Neon Inc.)<br />
              <a href="https://neon.tech">https://neon.tech</a><br />
              <br />
              <strong>Stockage des médias :</strong><br />
              Cloudinary Ltd.<br />
              <a href="https://cloudinary.com">https://cloudinary.com</a>
            </div>
          </Section>

          <Section title="4. Propriété intellectuelle">
            <p>L&apos;ensemble du contenu du site BizManager (structure, textes, logos, icônes, interfaces, code source) est protégé par le droit de la propriété intellectuelle et est la propriété exclusive de l&apos;éditeur, sauf mention contraire.</p>
            <p>Toute reproduction, représentation, modification, publication, transmission ou exploitation, totale ou partielle, du contenu ou de l&apos;interface de BizManager, par quelque procédé que ce soit, sans autorisation préalable écrite de l&apos;éditeur, est strictement interdite et constituerait une contrefaçon.</p>
            <p>Les marques, logos et dénominations cités sur ce site sont la propriété de leurs détenteurs respectifs.</p>
          </Section>

          <Section title="5. Limitation de responsabilité">
            <p>BizManager s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées sur ce site, dont il se réserve le droit de corriger le contenu à tout moment et sans préavis.</p>
            <p>BizManager ne peut être tenu responsable :</p>
            <ul style={ulStyle}>
              <li>Des erreurs ou omissions dans les informations fournies sur le site</li>
              <li>Des dommages directs ou indirects résultant de l&apos;utilisation ou de l&apos;impossibilité d&apos;accéder au site</li>
              <li>Des contenus des sites tiers vers lesquels ce site renvoie par des liens hypertextes</li>
            </ul>
          </Section>

          <Section title="6. Données personnelles">
            <p>La collecte et le traitement des données personnelles effectués via ce site sont encadrés par la loi camerounaise n° 2010/012 du 21 décembre 2010 relative à la cybersécurité et à la cybercriminalité au Cameroun, et décrits en détail dans notre <Link href="/politique-de-confidentialite" style={{ color: "#0A8F45" }}>Politique de confidentialité</Link>.</p>
            <p>Pour exercer vos droits ou pour toute question relative à vos données personnelles, contactez-nous à : <a href="mailto:contact@bizmanager.africa">contact@bizmanager.africa</a></p>
          </Section>

          <Section title="7. Cookies">
            <p>Ce site utilise un cookie de session sécurisé (httpOnly, Secure) strictement nécessaire au fonctionnement du service d&apos;authentification. Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.</p>
            <p>Pour plus de détails, consultez notre <Link href="/politique-de-confidentialite" style={{ color: "#0A8F45" }}>Politique de confidentialité</Link>.</p>
          </Section>

          <Section title="8. Droit applicable">
            <p>Les présentes mentions légales sont soumises au droit camerounais, ainsi qu&apos;aux Actes Uniformes de l&apos;Organisation pour l&apos;Harmonisation en Afrique du Droit des Affaires (OHADA), applicables au Cameroun en tant qu&apos;État partie.</p>
            <p>En cas de litige relatif à l&apos;interprétation ou à l&apos;exécution des présentes mentions légales, et à défaut de résolution amiable, les tribunaux camerounais compétents du ressort du siège social de l&apos;éditeur seront seuls compétents. Pour les litiges de nature commerciale relevant du droit uniforme OHADA, les parties pourront également recourir à l&apos;arbitrage de la Cour Commune de Justice et d&apos;Arbitrage (CCJA) de l&apos;OHADA, siégeant à Abidjan.</p>
          </Section>

          <Section title="9. Contact">
            <p>Pour toute question ou réclamation relative à ce site :</p>
            <div style={{ background: "#F8FAF9", border: "1px solid #E8ECEA", borderRadius: 10, padding: "14px 18px", fontSize: 14, color: "#1F2A24", lineHeight: 1.8 }}>
              Email : <a href="mailto:contact@bizmanager.africa">contact@bizmanager.africa</a><br />
              Site : <a href="https://bizmanager.africa">https://bizmanager.africa</a>
            </div>
          </Section>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #E8ECEA", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/cgu" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14, color: "#1d7c5f", textDecoration: "none" }}>Conditions Générales d&apos;Utilisation <ArrowRight size={13} strokeWidth={2.25} /></Link>
            <Link href="/politique-de-confidentialite" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14, color: "#1d7c5f", textDecoration: "none" }}>Politique de confidentialité <ArrowRight size={13} strokeWidth={2.25} /></Link>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

const ulStyle: React.CSSProperties = {
  paddingLeft: 20, color: "#667085", fontSize: 15, lineHeight: 1.8, margin: "0 0 12px",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1F2A24", margin: "0 0 14px", paddingBottom: 10, borderBottom: "1px solid #E8ECEA" }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, color: "#667085", lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  );
}
