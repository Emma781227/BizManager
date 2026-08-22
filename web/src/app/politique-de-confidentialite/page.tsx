import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Politique de confidentialité | BizManager",
  description: "Politique de confidentialité et protection des données personnelles de BizManager.",
};

const LAST_UPDATED = "21 juillet 2026";

export default function PolitiqueConfidentialitePage() {
  return (
    <div style={{ background: "#f6f8f7", minHeight: "100vh" }}>
      {/* Header */}
      <MarketingHeader />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8ECEA", padding: "48px 56px", boxShadow: "0 2px 12px rgba(16,24,40,.05)" }}>

          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1F2A24", margin: "0 0 8px" }}>
            Politique de confidentialité
          </h1>
          <p style={{ fontSize: 14, color: "#98A2B3", margin: "0 0 40px" }}>Dernière mise à jour : {LAST_UPDATED}</p>

          <Section title="1. Responsable du traitement">
            <p>Le responsable du traitement des données personnelles collectées via le service BizManager est :</p>
            <Box>
              <strong>BizManager</strong><br />
              Email : <a href="mailto:contact@bizmanager.africa">contact@bizmanager.africa</a><br />
              Site web : <a href="https://bizmanager.africa">https://bizmanager.africa</a><br />
              <em style={{ fontSize: 13, color: "#98A2B3" }}>Nom légal, siège social, RCCM et NIU : voir nos <Link href="/mentions-legales" style={{ color: "#0A8F45" }}>Mentions légales</Link></em>
            </Box>
          </Section>

          <Section title="2. Données collectées">
            <p>Nous collectons les données suivantes selon votre utilisation du service :</p>
            <h4 style={h4Style}>Lors de l&apos;inscription</h4>
            <ul style={ulStyle}>
              <li>Nom complet</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone (optionnel)</li>
              <li>Mot de passe (stocké sous forme hachée, jamais en clair)</li>
            </ul>
            <h4 style={h4Style}>Lors de l&apos;utilisation du tableau de bord</h4>
            <ul style={ulStyle}>
              <li>Informations sur vos boutiques (nom, description, logo, adresse)</li>
              <li>Catalogue produits (noms, prix, images, stocks)</li>
              <li>Données clients (noms, téléphones, emails de vos propres clients)</li>
              <li>Commandes et transactions</li>
              <li>Journaux d&apos;activité (actions effectuées, horodatages)</li>
            </ul>
            <h4 style={h4Style}>Automatiquement</h4>
            <ul style={ulStyle}>
              <li>Adresse IP de connexion</li>
              <li>Données de session (token JWT stocké dans un cookie httpOnly sécurisé)</li>
              <li>Logs d&apos;erreurs techniques</li>
            </ul>
            <h4 style={h4Style}>Données des clients de vos boutiques</h4>
            <p>En tant que marchand utilisant BizManager, vous collectez et saisissez des données de vos propres clients (noms, téléphones). Pour ces données, vous êtes responsable du traitement au sens du RGPD et des lois locales applicables. BizManager agit comme sous-traitant pour ces données.</p>
          </Section>

          <Section title="3. Finalités du traitement">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Finalité</th>
                  <th style={thStyle}>Base légale</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Création et gestion de votre compte", "Exécution du contrat"],
                  ["Fourniture du service (boutique, commandes, paiements)", "Exécution du contrat"],
                  ["Envoi d'emails transactionnels (confirmations, alertes)", "Exécution du contrat"],
                  ["Envoi de notifications WhatsApp pour votre activité", "Exécution du contrat"],
                  ["Traitement des paiements d'abonnement", "Exécution du contrat"],
                  ["Prévention de la fraude et sécurité", "Intérêt légitime"],
                  ["Amélioration du service (analytics internes)", "Intérêt légitime"],
                  ["Respect de nos obligations légales", "Obligation légale"],
                ].map(([fin, base], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#F8FAF9" }}>
                    <td style={tdStyle}>{fin}</td>
                    <td style={{ ...tdStyle, color: "#0A8F45", fontWeight: 600 }}>{base}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="4. Sous-traitants et tiers">
            <p>Nous faisons appel aux prestataires suivants pour fournir le service. Chacun dispose de sa propre politique de confidentialité :</p>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Prestataire</th>
                  <th style={thStyle}>Rôle</th>
                  <th style={thStyle}>Données transmises</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Vercel", "Hébergement de l'application", "Logs serveur, adresses IP"],
                  ["Neon (PostgreSQL)", "Base de données", "Toutes les données du compte"],
                  ["Cloudinary", "Stockage des images produits", "Images uploadées"],
                  ["GeniusPay", "Paiements en ligne", "Montant, email, référence commande"],
                  ["Meta (WhatsApp Cloud API)", "Notifications WhatsApp", "Numéro de téléphone, message OTP"],
                  ["Fournisseur SMTP", "Envoi d'emails", "Email, contenu du message"],
                ].map(([pres, role, data], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#F8FAF9" }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{pres}</td>
                    <td style={tdStyle}>{role}</td>
                    <td style={{ ...tdStyle, fontSize: 12, color: "#667085" }}>{data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 13, color: "#667085", marginTop: 12 }}>Nous ne vendons jamais vos données à des tiers à des fins commerciales.</p>
          </Section>

          <Section title="5. Durée de conservation">
            <ul style={ulStyle}>
              <li><strong>Données de compte actif :</strong> conservées pendant toute la durée de votre abonnement.</li>
              <li><strong>Après suppression du compte :</strong> suppression dans un délai de 30 jours, sauf obligation légale.</li>
              <li><strong>Données de facturation :</strong> conservées 10 ans conformément aux obligations comptables.</li>
              <li><strong>Logs de sécurité :</strong> conservés 12 mois maximum.</li>
              <li><strong>Codes OTP de livraison :</strong> supprimés automatiquement 24h après vérification ou expiration.</li>
            </ul>
          </Section>

          <Section title="6. Vos droits">
            <p>Conformément à la loi camerounaise n° 2010/012 du 21 décembre 2010 relative à la cybersécurité et à la cybercriminalité au Cameroun, qui encadre la protection des données à caractère personnel, ainsi qu&apos;à la Convention de l&apos;Union Africaine sur la cybersécurité et la protection des données à caractère personnel (Convention de Malabo, ratifiée par le Cameroun), vous disposez des droits suivants sur vos données :</p>
            <ul style={ulStyle}>
              <li><strong>Droit d&apos;accès :</strong> obtenir une copie de vos données personnelles.</li>
              <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes.</li>
              <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données dans les cas prévus par la loi.</li>
              <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et lisible par machine.</li>
              <li><strong>Droit d&apos;opposition :</strong> vous opposer à certains traitements basés sur notre intérêt légitime.</li>
              <li><strong>Droit de limitation :</strong> demander la suspension temporaire d&apos;un traitement.</li>
            </ul>
            <p>Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@bizmanager.africa">contact@bizmanager.africa</a></p>
            <p>Nous répondrons dans un délai maximum de 30 jours. À défaut de réponse satisfaisante, vous pouvez saisir l&apos;Agence Nationale des Technologies de l&apos;Information et de la Communication (ANTIC), autorité camerounaise en charge de la régulation de la cybersécurité et de la certification électronique.</p>
          </Section>

          <Section title="7. Cookies et stockage local">
            <p>BizManager utilise :</p>
            <ul style={ulStyle}>
              <li><strong>Cookie de session (httpOnly, Secure) :</strong> contient votre token d&apos;authentification JWT. Strictement nécessaire au fonctionnement du service. Expire après 7 jours d&apos;inactivité.</li>
              <li><strong>localStorage :</strong> utilisé pour mémoriser votre boutique active dans le tableau de bord. Aucune donnée sensible.</li>
            </ul>
            <p>Nous n&apos;utilisons pas de cookies publicitaires, de tracking tiers, ou d&apos;outils d&apos;analyse comportementale externes.</p>
          </Section>

          <Section title="8. Sécurité">
            <ul style={ulStyle}>
              <li>Mots de passe hachés avec bcrypt (jamais stockés en clair)</li>
              <li>Connexions chiffrées via HTTPS / TLS</li>
              <li>Tokens d&apos;authentification JWT signés avec une clé secrète</li>
              <li>Codes OTP hachés avec HMAC-SHA256</li>
              <li>Accès à la base de données restreint et chiffré</li>
              <li>Rate limiting sur les endpoints sensibles</li>
            </ul>
          </Section>

          <Section title="9. Transferts internationaux">
            <p>Certains de nos sous-traitants sont basés en dehors du Cameroun et de la zone OHADA (États-Unis principalement : Vercel, Neon, Cloudinary). Conformément à la loi n° 2010/012 relative à la cybersécurité et à la cybercriminalité, ces transferts de données hors du territoire camerounais ne sont effectués qu&apos;auprès de prestataires offrant des garanties de sécurité et de confidentialité adéquates (clauses contractuelles, certifications de sécurité reconnues), et strictement dans la limite nécessaire à la fourniture du service.</p>
          </Section>

          <Section title="10. Modifications de cette politique">
            <p>Nous pouvons mettre à jour cette politique à tout moment. En cas de modification substantielle, nous vous notifierons par email ou via une bannière dans l&apos;application. La date de dernière mise à jour est toujours indiquée en haut de cette page.</p>
            <p>En continuant à utiliser BizManager après une modification, vous acceptez la nouvelle politique.</p>
          </Section>

          <Section title="11. Contact">
            <p>Pour toute question relative à vos données personnelles :</p>
            <Box>
              Email : <a href="mailto:contact@bizmanager.africa">contact@bizmanager.africa</a><br />
              Site : <a href="https://bizmanager.africa">https://bizmanager.africa</a>
            </Box>
          </Section>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #E8ECEA", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/cgu" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14, color: "#1d7c5f", textDecoration: "none" }}>Conditions Générales d&apos;Utilisation <ArrowRight size={13} strokeWidth={2.25} /></Link>
            <Link href="/mentions-legales" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14, color: "#1d7c5f", textDecoration: "none" }}>Mentions légales <ArrowRight size={13} strokeWidth={2.25} /></Link>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const h4Style: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: "#1F2A24", margin: "20px 0 8px",
};

const ulStyle: React.CSSProperties = {
  paddingLeft: 20, color: "#667085", fontSize: 15, lineHeight: 1.8, margin: "0 0 12px",
};

const tableStyle: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 12,
  border: "1px solid #E8ECEA", borderRadius: 10, overflow: "hidden",
};

const thStyle: React.CSSProperties = {
  padding: "10px 14px", textAlign: "left", background: "#F8FAF9",
  color: "#667085", fontWeight: 600, fontSize: 12,
  borderBottom: "1px solid #E8ECEA",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 14px", color: "#1F2A24",
  borderBottom: "1px solid #F4F6F5", verticalAlign: "top",
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

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#F8FAF9", border: "1px solid #E8ECEA", borderRadius: 10, padding: "14px 18px", fontSize: 14, color: "#1F2A24", lineHeight: 1.8, margin: "12px 0" }}>
      {children}
    </div>
  );
}
