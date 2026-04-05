import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-home">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-kicker">Vendez plus, sans complexite</p>
          <h1>Votre boutique en ligne prete en quelques minutes</h1>
          <p>
            Creez votre boutique, ajoutez vos produits, recevez des commandes
            WhatsApp et suivez vos ventes depuis un seul tableau de bord.
          </p>
          <div className="landing-hero-cta">
            <Link className="landing-btn-primary" href="/login">
              Creer ma boutique
            </Link>
            <Link className="landing-btn-secondary" href="/shop/bizmanager-douala">
              Voir une demo client
            </Link>
          </div>
          <div className="landing-trust-row">
            <span>Boutique publique partageable</span>
            <span>Commande via WhatsApp</span>
            <span>Gestion simple du stock</span>
          </div>
        </div>

        <div className="landing-hero-panel">
          <h3>Ce que vous gagnez des le premier jour</h3>
          <ul>
            <li>Un lien boutique a partager sur WhatsApp, Facebook et Instagram</li>
            <li>Des commandes centralisees, meme sans site complexe</li>
            <li>Un suivi clients, paiements et stocks en temps reel</li>
            <li>Une interface mobile simple pour gerer votre activite</li>
          </ul>
          <Link className="landing-inline-link" href="/login">
            Commencer gratuitement
          </Link>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-head">
          <h2>Pourquoi les commercants aiment BizManager</h2>
          <p>
            Une solution legere, moderne et pensee pour les ventes terrain.
          </p>
        </div>
        <div className="landing-benefits-grid">
          <article className="landing-benefit-card">
            <h3>Plus de ventes</h3>
            <p>
              Vos clients accedent a votre catalogue en un clic et commandent
              rapidement.
            </p>
          </article>
          <article className="landing-benefit-card">
            <h3>Gain de temps</h3>
            <p>
              Produits, clients, commandes et paiements sont regroupes dans une
              seule application.
            </p>
          </article>
          <article className="landing-benefit-card">
            <h3>Controle du stock</h3>
            <p>
              Le stock diminue automatiquement a chaque commande, avec alertes
              en cas de rupture.
            </p>
          </article>
          <article className="landing-benefit-card">
            <h3>Relation client renforcee</h3>
            <p>
              Recuperez les contacts, suivez l&apos;historique et relancez vos
              meilleurs clients facilement.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-section landing-flow">
        <div className="landing-section-head">
          <h2>Comment ca marche</h2>
          <p>Trois etapes pour commencer a vendre en ligne.</p>
        </div>
        <div className="landing-steps">
          <article className="landing-step-card">
            <span>01</span>
            <h3>Creez votre boutique</h3>
            <p>
              Inscription rapide, configuration du nom, WhatsApp et ville en
              quelques minutes.
            </p>
          </article>
          <article className="landing-step-card">
            <span>02</span>
            <h3>Ajoutez vos produits</h3>
            <p>
              Importez photos, prix, stock et categories avec un formulaire
              assiste.
            </p>
          </article>
          <article className="landing-step-card">
            <span>03</span>
            <h3>Recevez vos commandes</h3>
            <p>
              Vos clients commandent via WhatsApp, vous suivez tout depuis votre
              espace commercant.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-final-cta">
        <h2>Pret a lancer votre boutique digitale aujourd&apos;hui ?</h2>
        <p>
          Rejoignez les commercants qui vendent plus vite avec une gestion
          simple et moderne.
        </p>
        <div className="landing-hero-cta">
          <Link className="landing-btn-primary" href="/login">
            Je cree ma boutique
          </Link>
          <Link className="landing-btn-secondary" href="/shop/bizmanager-douala">
            Voir le parcours client
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-top">
          <div className="landing-footer-brand">
            <h3>BizManager</h3>
            <p>
              La plateforme simple pour vendre en ligne, gerer vos commandes et
              piloter votre boutique depuis votre telephone.
            </p>
            <Link className="landing-footer-cta" href="/login">
              Ouvrir ma boutique
            </Link>
          </div>

          <div className="landing-footer-column">
            <h4>Produit</h4>
            <Link href="/shop/bizmanager-douala">Demo boutique</Link>
            <Link href="/login">Espace commercant</Link>
            <Link href="/login">Creer une boutique</Link>
          </div>

          <div className="landing-footer-column">
            <h4>Ressources</h4>
            <a href="#">Centre d&apos;aide</a>
            <a href="#">Guides de vente</a>
            <a href="#">Support WhatsApp</a>
          </div>

          <div className="landing-footer-column">
            <h4>Confiance</h4>
            <p>Boutique publique securisee</p>
            <p>Commande via WhatsApp</p>
            <p>Gestion de stock centralisee</p>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <p>© {new Date().getFullYear()} BizManager. Tous droits reserves.</p>
          <div className="landing-footer-legal">
            <a href="#">Conditions</a>
            <a href="#">Confidentialite</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
