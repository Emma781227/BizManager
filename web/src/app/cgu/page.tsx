import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — BizManager",
  description: "Conditions générales d'utilisation du service BizManager.",
};

const LAST_UPDATED = "21 juillet 2026";

export default function CguPage() {
  return (
    <div style={{ background: "#F8FAF9", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #E8ECEA", padding: "0 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#0A8F45", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>BM</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1F2A24" }}>BizManager</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: "#667085", textDecoration: "none" }}>← Retour à l&apos;accueil</Link>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8ECEA", padding: "48px 56px", boxShadow: "0 2px 12px rgba(16,24,40,.05)" }}>

          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1F2A24", margin: "0 0 8px" }}>
            Conditions Générales d&apos;Utilisation
          </h1>
          <p style={{ fontSize: 14, color: "#98A2B3", margin: "0 0 40px" }}>Dernière mise à jour : {LAST_UPDATED}</p>

          <Section title="1. Objet et acceptation">
            <p>Les présentes Conditions Générales d&apos;Utilisation (« CGU ») régissent l&apos;accès et l&apos;utilisation du service BizManager (ci-après le « Service »), accessible sur le site <a href="https://bizmanager.africa">https://bizmanager.africa</a> et ses sous-domaines.</p>
            <p>En créant un compte, vous acceptez sans réserve les présentes CGU. Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le Service.</p>
            <p>Ces CGU peuvent être modifiées à tout moment. En cas de modification substantielle, vous serez notifié par email. La version en vigueur est toujours celle disponible sur cette page.</p>
            <p>Conformément à la loi camerounaise n° 2010/012 du 21 décembre 2010 relative à la cybersécurité et à la cybercriminalité, qui reconnaît la validité juridique de l&apos;écrit électronique, de la signature électronique et des contrats conclus par voie électronique, votre acceptation des présentes CGU lors de la création de votre compte a la même valeur juridique qu&apos;une signature manuscrite.</p>
          </Section>

          <Section title="2. Description du service">
            <p>BizManager est une plateforme SaaS (Software as a Service) permettant aux commerçants de :</p>
            <ul style={ulStyle}>
              <li>Créer et gérer une ou plusieurs boutiques en ligne</li>
              <li>Gérer un catalogue de produits avec images, prix et stocks</li>
              <li>Recevoir et traiter des commandes clients</li>
              <li>Gérer une base clients</li>
              <li>Accepter des paiements en ligne via GeniusPay (Orange Money, Mobile Money, virement)</li>
              <li>Communiquer avec les clients via WhatsApp</li>
              <li>Gérer une équipe avec des rôles et permissions</li>
            </ul>
            <p>Le Service est fourni « en l&apos;état » et peut évoluer à tout moment. BizManager se réserve le droit d&apos;ajouter, modifier ou supprimer des fonctionnalités.</p>
          </Section>

          <Section title="3. Inscription et compte">
            <p><strong>Éligibilité :</strong> Le Service est réservé aux professionnels et commerçants exerçant une activité commerciale légale. Vous devez être majeur selon la loi de votre pays de résidence.</p>
            <p><strong>Exactitude des informations :</strong> Vous vous engagez à fournir des informations exactes, complètes et à jour lors de votre inscription et à les maintenir à jour.</p>
            <p><strong>Sécurité du compte :</strong> Vous êtes seul responsable de la confidentialité de vos identifiants de connexion. Toute activité réalisée depuis votre compte est de votre responsabilité. En cas de compromission, vous devez nous contacter immédiatement.</p>
            <p><strong>Un compte par personne :</strong> La création de comptes multiples pour contourner les limitations de plan est interdite.</p>
            <p><strong>Immatriculation commerciale :</strong> Conformément à l&apos;Acte Uniforme OHADA relatif au Droit Commercial Général (AUDCG), toute personne exerçant une activité commerciale à titre habituel doit être immatriculée au Registre du Commerce et du Crédit Mobilier (RCCM) et disposer d&apos;un Numéro d&apos;Identifiant Unique (NIU) délivré par l&apos;administration fiscale de son pays. Il vous appartient de vérifier et de respecter les obligations d&apos;immatriculation et fiscales applicables à votre activité.</p>
          </Section>

          <Section title="4. Plans tarifaires et abonnements">
            <p>BizManager propose les plans suivants :</p>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Plan</th>
                  <th style={thStyle}>Prix</th>
                  <th style={thStyle}>Boutiques</th>
                  <th style={thStyle}>Produits</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Starter", "Gratuit", "1", "20"],
                  ["Business", "4 500 FCFA/mois", "3", "500"],
                  ["Premium", "10 000 FCFA/mois", "10", "Illimité"],
                ].map(([plan, prix, boutiques, produits], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#F8FAF9" }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{plan}</td>
                    <td style={tdStyle}>{prix}</td>
                    <td style={tdStyle}>{boutiques}</td>
                    <td style={tdStyle}>{produits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p><strong>Facturation :</strong> Les abonnements payants sont facturés mensuellement ou annuellement selon votre choix, via GeniusPay. Le paiement est dû à la souscription et se renouvelle automatiquement.</p>
            <p><strong>Mise à niveau / rétrogradation :</strong> Vous pouvez changer de plan à tout moment. Les changements prennent effet immédiatement.</p>
            <p><strong>Remboursements :</strong> En cas de bug technique majeur rendant le service inutilisable, un remboursement au prorata peut être accordé sur demande dans les 7 jours. Hors ce cas, les paiements ne sont pas remboursables.</p>
          </Section>

          <Section title="5. Utilisation acceptable">
            <p>En utilisant BizManager, vous vous engagez à ne pas :</p>
            <ul style={ulStyle}>
              <li>Vendre des produits illicites, contrefaits, dangereux ou interdits par la loi</li>
              <li>Utiliser le service pour des activités frauduleuses ou trompeuses</li>
              <li>Collecter des données de tiers sans leur consentement</li>
              <li>Tenter d&apos;accéder au code source, aux systèmes ou aux données d&apos;autres utilisateurs</li>
              <li>Soumettre le service à des tests de charge non autorisés ou des attaques</li>
              <li>Revendre ou sous-louer l&apos;accès au service à des tiers</li>
              <li>Publier des contenus offensants, diffamatoires ou violant les droits de tiers</li>
            </ul>
            <p>Toute violation peut entraîner la suspension immédiate du compte sans préavis ni remboursement.</p>
          </Section>

          <Section title="6. Données clients de votre boutique">
            <p>En utilisant BizManager pour gérer vos clients, vous êtes responsable du traitement de leurs données personnelles au sens des lois applicables. À ce titre, vous vous engagez à :</p>
            <ul style={ulStyle}>
              <li>Collecter uniquement les données nécessaires à votre activité commerciale</li>
              <li>Informer vos clients de la collecte et de l&apos;utilisation de leurs données</li>
              <li>Respecter les droits de vos clients (accès, rectification, suppression)</li>
              <li>Ne pas utiliser les données clients à des fins autres que la gestion des commandes</li>
            </ul>
            <p>BizManager agit comme sous-traitant pour ces données et les traite uniquement sur vos instructions.</p>
          </Section>

          <Section title="7. Protection du consommateur">
            <p>BizManager est un prestataire technique qui met à disposition des marchands les outils nécessaires à la gestion de leur activité commerciale (catalogue, commandes, paiements, communication client). <strong>BizManager n&apos;est pas partie au contrat de vente</strong> conclu entre un marchand et ses clients : ce contrat engage exclusivement le marchand, seul vendeur au sens de la loi.</p>
            <p>En tant que marchand, vous vous engagez à respecter les dispositions de la loi camerounaise n° 2011/012 du 6 mai 2011 portant Code de protection du consommateur, notamment :</p>
            <ul style={ulStyle}>
              <li>Fournir une information claire, loyale et complète sur vos produits (nature, prix, disponibilité)</li>
              <li>Afficher des prix exacts et ne pas recourir à des pratiques commerciales trompeuses</li>
              <li>Garantir la conformité des produits vendus et traiter les réclamations de vos clients</li>
              <li>Respecter le droit à la sécurité et à l&apos;information du consommateur</li>
            </ul>
            <p>BizManager se réserve le droit de suspendre tout compte marchand ne respectant pas ces obligations légales.</p>
          </Section>

          <Section title="8. Propriété intellectuelle">
            <p><strong>Service BizManager :</strong> L&apos;ensemble du service (code, interfaces, marques, logos, documentation) est la propriété exclusive de BizManager et est protégé par le droit de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.</p>
            <p><strong>Vos contenus :</strong> Les produits, images, textes et informations que vous ajoutez sur votre boutique restent votre propriété. Vous nous accordez une licence non exclusive pour les stocker et les afficher dans le cadre du service.</p>
            <p><strong>Feedback :</strong> Tout retour, suggestion ou idée d&apos;amélioration que vous partagez avec nous peut être utilisé librement pour améliorer le service, sans obligation de contrepartie.</p>
          </Section>

          <Section title="9. Disponibilité et support">
            <p>BizManager vise une disponibilité maximale du service, mais ne garantit pas une disponibilité ininterrompue. Des maintenances planifiées ou incidents techniques peuvent temporairement rendre le service indisponible.</p>
            <p>Le support est disponible par email à <a href="mailto:contact@bizmanager.africa">contact@bizmanager.africa</a>. Les délais de réponse varient selon le plan souscrit.</p>
          </Section>

          <Section title="10. Limitation de responsabilité">
            <p>Dans les limites autorisées par la loi :</p>
            <ul style={ulStyle}>
              <li>BizManager n&apos;est pas responsable des pertes de revenus, de données ou d&apos;opportunités liées à une interruption du service.</li>
              <li>BizManager n&apos;est pas responsable des transactions commerciales réalisées entre les marchands et leurs clients.</li>
              <li>BizManager n&apos;est pas responsable du contenu publié par les marchands sur leurs boutiques.</li>
              <li>La responsabilité totale de BizManager ne peut excéder le montant payé par l&apos;utilisateur au cours des 3 derniers mois.</li>
            </ul>
            <p>Ces limitations ne s&apos;appliquent pas en cas de faute grave ou intentionnelle de notre part.</p>
          </Section>

          <Section title="11. Suspension et résiliation">
            <p><strong>Par vous :</strong> Vous pouvez résilier votre compte à tout moment depuis votre tableau de bord ou en nous contactant. En cas de résiliation, vos données seront supprimées dans un délai de 30 jours.</p>
            <p><strong>Par BizManager :</strong> Nous pouvons suspendre ou résilier un compte en cas de :</p>
            <ul style={ulStyle}>
              <li>Violation des présentes CGU</li>
              <li>Non-paiement d&apos;un abonnement</li>
              <li>Activité frauduleuse ou illicite</li>
              <li>Inactivité prolongée (compte sans connexion depuis plus de 12 mois)</li>
            </ul>
            <p>Nous vous notifierons dans la mesure du possible avant toute suspension, sauf urgence (fraude avérée, risque de sécurité).</p>
          </Section>

          <Section title="12. Droit applicable et litiges">
            <p>Les présentes CGU sont régies par le droit camerounais, ainsi que par les Actes Uniformes de l&apos;OHADA applicables aux actes de commerce et aux relations entre commerçants.</p>
            <p>En cas de litige, les parties s&apos;efforceront de trouver une solution amiable avant tout recours judiciaire. À défaut d&apos;accord amiable, le litige sera porté devant les juridictions camerounaises compétentes du ressort du siège social de BizManager, sous réserve, pour les litiges commerciaux relevant du droit uniforme OHADA, de la possibilité de recourir à l&apos;arbitrage de la Cour Commune de Justice et d&apos;Arbitrage (CCJA).</p>
            <p>Pour tout litige, contactez-nous en premier lieu à <a href="mailto:contact@bizmanager.africa">contact@bizmanager.africa</a>.</p>
          </Section>

          <Section title="13. Contact">
            <p>Pour toute question relative aux présentes CGU :</p>
            <div style={{ background: "#F8FAF9", border: "1px solid #E8ECEA", borderRadius: 10, padding: "14px 18px", fontSize: 14, color: "#1F2A24", lineHeight: 1.8, margin: "12px 0" }}>
              Email : <a href="mailto:contact@bizmanager.africa">contact@bizmanager.africa</a><br />
              Site : <a href="https://bizmanager.africa">https://bizmanager.africa</a>
            </div>
          </Section>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #E8ECEA", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/politique-de-confidentialite" style={{ fontSize: 14, color: "#0A8F45", textDecoration: "none" }}>Politique de confidentialité →</Link>
            <Link href="/mentions-legales" style={{ fontSize: 14, color: "#0A8F45", textDecoration: "none" }}>Mentions légales →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

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
