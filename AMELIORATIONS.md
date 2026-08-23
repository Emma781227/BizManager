# Plan d'amélioration BizManager

État des lieux et feuille de route, établis en auditant le code de la branche
`redesign/professional-ui` le 22 août 2026.

Chaque constat ci-dessous est vérifiable : le fichier et la ligne sont cités, et
la méthode de mesure est donnée en annexe. Rien ici n'est une bonne pratique
générique, tout part de ce que fait réellement ce projet.

---

## Comment lire ce document

Les chantiers sont classés par priorité, pas par difficulté. La priorité répond
à une seule question : **que risque-t-on à ne rien faire ?**

| Niveau | Signification |
|--------|---------------|
| **P0** | Risque de sécurité, d'argent ou de droit. À traiter avant d'ouvrir aux vrais clients. |
| **P1** | Impact direct sur les revenus : lenteur, abandon de commande, référencement. |
| **P2** | Fiabilité et qualité perçue. Peu visible tant que rien ne casse. |
| **P3** | Dette technique. N'urge pas, coûte de plus en plus cher avec le temps. |

L'estimation d'effort suppose une personne qui connaît déjà le projet.

---

## Résumé

| # | Chantier | Priorité | Effort |
|---|----------|----------|--------|
| 1 | Limiter le débit sur les routes d'authentification | P0 | 0,5 j |
| 2 | Rendre le limiteur de débit compatible serverless | P0 | 0,5 j |
| 3 | Retirer les avis clients fabriqués | P0 | 0,5 j |
| 4 | Poser un socle de tests automatisés | P0 | 3 à 5 j |
| 5 | Optimiser les images produit | P1 | 1 j |
| 6 | Rendre la vitrine côté serveur | P1 | 3 à 4 j |
| 7 | Ajouter les frontières d'erreur et de chargement | P2 | 1 j |
| 8 | Corriger le formatage des montants en FCFA | P2 | 0,5 j |
| 9 | Résorber les 39 erreurs ESLint | P2 | 1,5 j |
| 10 | Découper les fichiers de plus de 1000 lignes | P3 | 5 j+ |
| 11 | Mettre en place une intégration continue | P3 | 0,5 j |

---

## P0 : à traiter avant l'ouverture au public

### 1. Limiter le débit sur les routes d'authentification

**Constat.** Sur les 42 routes API du projet, 3 seulement sont protégées par un
limiteur de débit :

```
src/app/api/auth/accept-invitation/route.ts
src/app/api/public/shop/[slug]/orders/route.ts
src/app/api/public/shop/[slug]/pay/route.ts
```

Ne sont **pas** protégées, alors qu'elles sont publiques et sensibles :

| Route | Ce qu'un attaquant peut faire |
|-------|-------------------------------|
| `/api/auth/login` | Tester des mots de passe en boucle, sans plafond |
| `/api/auth/register/request-code` | Envoyer des milliers d'emails depuis votre compte SMTP |
| `/api/auth/forgot-password/request-code` | Idem, et harceler une adresse ciblée |
| `/api/shop/check-slug` | Énumérer les boutiques existantes |

Les deux routes d'envoi de code sont les plus coûteuses : elles déclenchent un
email à chaque appel. Un script peut faire griller le quota SMTP, faire
blacklister le domaine expéditeur, et rendre l'inscription impossible pour tout
le monde.

**Action.** Le limiteur existe déjà et son interface convient. Il suffit de
l'appeler dans ces routes, avec des fenêtres adaptées au coût de chaque appel :

- `login` : 10 tentatives par IP et par tranche de 15 minutes, plus un compteur
  séparé par adresse email pour qu'un attaquant changeant d'IP soit quand même
  freiné.
- `*/request-code` : 3 par IP et par heure, 3 par adresse email et par heure.
- `check-slug` : 60 par IP et par minute, suffisant pour la frappe au clavier.

**Terminé quand** un script qui appelle `login` 50 fois de suite reçoit des `429`
à partir de la onzième tentative, et qu'un test automatisé le vérifie.

---

### 2. Rendre le limiteur de débit compatible serverless

**Constat.** `src/lib/ratelimit.ts` documente lui-même sa limite :

> Sur Vercel / serverless multi-instances, chaque instance Node.js a son propre
> compteur. La protection reste efficace contre les bots simples et les attaques
> mono-instance, mais n'est pas absolue sous forte charge distribuée.

Le compteur vit dans un `Map` en mémoire, sur `globalThis`. En production sur
Vercel, chaque invocation peut atterrir sur une instance différente, et les
instances froides démarrent avec un compteur vide. Le plafond réel n'est donc pas
« 10 tentatives » mais « 10 tentatives multipliées par le nombre d'instances
actives », un nombre que personne ne contrôle.

Cela vide en partie le chantier 1 de sa substance : brancher le limiteur sur plus
de routes est utile, mais la garantie reste faible tant que le stockage est local.

**Action.** Basculer le stockage sur Upstash Redis, comme le commentaire du
fichier le recommande déjà. Le point important est de **ne pas changer
l'interface** : `checkRateLimit(clé, limite, fenêtre)` garde la même signature,
seule l'implémentation devient asynchrone. Les appels existants ne bougent pas.

Prévoir le repli : si Redis est injoignable, mieux vaut laisser passer la requête
en journalisant l'incident que de bloquer toute l'authentification du site.

**Terminé quand** deux instances distinctes partagent le même compteur, vérifié
en environnement de préproduction.

---

### 3. Retirer les avis clients fabriqués

**Constat.** `src/app/shop/[slug]/products/[productId]/page.tsx` contient des
données sociales inventées, servies telles quelles à de vrais clients :

- une liste d'avis en dur (« Aïcha M. », « Magnifique produit, qualité
  irréprochable ! », « Il y a 2 jours »)
- la mention « 168 avis » et « Basé sur 32 avis »
- « Membre depuis 2022 »
- cinq étoiles pleines affichées sur **chaque** produit recommandé, sans qu'aucune
  note n'existe en base

Ces éléments ne sont pas des maquettes internes : ils s'affichent sur la boutique
publique, sous le prix, à l'endroit exact où un acheteur cherche une preuve de
confiance avant de payer.

**Pourquoi c'est classé P0.** Le projet publie ses propres CGU rédigées sous droit
camerounais. Afficher de faux avis pour favoriser une vente relève de la pratique
commerciale trompeuse dans la plupart des cadres de protection du consommateur.
Le risque ne pèse pas seulement sur BizManager mais sur chaque marchand hébergé,
qui n'a jamais choisi d'afficher ces avis.

**Action.** Deux options, à trancher côté produit :

- *Court terme.* Retirer les blocs d'avis et de notes. Une fiche produit sans avis
  est parfaitement crédible ; une fiche avec de faux avis ne l'est plus une fois
  la supercherie repérée.
- *Cible.* Ajouter un modèle `Review` en base, alimenté après livraison confirmée
  (le mécanisme d'OTP de livraison existe déjà et donne exactement le signal
  « ce client a bien reçu ce produit »). Afficher les notes uniquement quand il y
  en a.

La même remarque vaut pour les témoignages de la page d'accueil, rétablis à la
demande : ils sont acceptables s'ils correspondent à de vrais utilisateurs, à
remplacer sinon.

---

### 4. Poser un socle de tests automatisés

**Constat.** Le projet ne contient aucun test. Ni fichier `*.test.*`, ni
`*.spec.*`, ni configuration Vitest, Jest ou Playwright.

Ce que cela signifie concrètement : rien ne vérifie automatiquement que

- un marchand ne peut pas lire les commandes d'un autre marchand,
- les quotas de plan bloquent réellement la création au-delà de la limite,
- l'OTP de livraison refuse un code expiré ou une sixième tentative,
- le webhook GeniusPay rejette une signature invalide,
- un paiement reçu deux fois ne crédite pas deux fois.

Ces cinq comportements touchent à l'argent ou à l'isolation entre clients. Ce sont
exactement ceux qu'une régression silencieuse rend dangereux.

**Action.** Ne pas viser une couverture globale, viser les chemins critiques.
Dans l'ordre :

1. **Vitest** pour les fonctions pures : `src/lib/validators.ts`,
   `src/lib/permissions.ts`, `src/lib/shop.ts` (quotas), `src/lib/format.ts`.
   Rapide à écrire, aucun besoin de base de données.
2. **Tests d'intégration des routes API** sur une base PostgreSQL jetable
   (Docker, le `docker-compose.yml` est déjà là). Priorité à l'isolation
   multi-tenant : un utilisateur A ne doit jamais atteindre les données de B.
3. **Playwright** sur deux parcours seulement : inscription puis création de
   boutique, et commande client de bout en bout jusqu'au paiement.

**Terminé quand** ces tests tournent en intégration continue et bloquent la fusion
en cas d'échec (voir chantier 11).

---

## P1 : impact direct sur les revenus

### 5. Optimiser les images produit

**Constat.** Deux problèmes qui se cumulent.

`src/lib/cloudinary.ts` téléverse sans aucune transformation :

```ts
.upload_stream({ folder, resource_type: resourceType }, ...)
```

Aucun `f_auto`, aucun `q_auto`, aucune largeur maximale. L'URL enregistrée en base
pointe vers l'original. La limite acceptée est de 20 Mo par fichier.

En parallèle, 17 balises `<img>` brutes contournent le composant `next/image`,
signalées par ESLint (`@next/next/no-img-element`).

**Pourquoi cela compte pour ce produit précisément.** Les marchands
photographient leurs articles au téléphone : 3 à 5 Mo par image est la norme. Ces
fichiers partent tels quels vers des clients qui consultent la boutique sur
données mobiles. Une grille de 12 produits peut représenter 40 Mo. Sur une
connexion 3G, la page ne s'affiche jamais et le client s'en va avant de voir le
prix.

C'est probablement le point de ce document qui coûte le plus de commandes
aujourd'hui, et c'est aussi le moins cher à corriger.

**Action.**

1. Ajouter les transformations à l'upload : `f_auto` (WebP ou AVIF selon le
   navigateur), `q_auto`, et une largeur maximale de l'ordre de 1600 px. Gain
   typique : 80 à 90 % du poids, sans différence visible.
2. Servir des variantes selon l'usage : vignette de grille, image de fiche,
   plein écran. Cloudinary les génère à la volée depuis l'URL.
3. Remplacer les `<img>` restantes par `next/image`, avec `sizes` correct pour
   que le navigateur choisisse la bonne variante.
4. Traiter les 3 avertissements `jsx-a11y/alt-text` au passage.

**Terminé quand** le poids total de la vitrine d'une boutique de 12 produits passe
sous 1,5 Mo, mesuré dans l'onglet réseau du navigateur.

---

### 6. Rendre la vitrine côté serveur

**Constat.** 17 des 24 pages sont des composants client qui récupèrent leurs
données dans un `useEffect` après affichage. Seules 7 pages sont rendues côté
serveur, et pour la vitrine, `shop/[slug]/page.tsx` délègue immédiatement à
`ShopPageClient.tsx`, un composant client de 1643 lignes.

Conséquences pour la boutique publique :

- **Premier affichage vide.** Le visiteur reçoit une page sans contenu, puis un
  écran de chargement, puis les produits. Sur connexion lente, cela ajoute un
  aller-retour complet avant le moindre pixel utile.
- **Référencement dégradé.** Le HTML servi ne contient ni les noms de produits,
  ni les prix, ni les descriptions. Pour un produit dont l'argument central est
  « partagez le lien de votre boutique », être mal indexé est un handicap direct.
- **Aperçus de partage pauvres.** Quand un marchand colle son lien dans WhatsApp,
  l'aperçu se construit sur le HTML initial.

**Action.** Ne pas tout réécrire. Cibler la vitrine, là où le visiteur n'est pas
encore client :

1. `shop/[slug]/page.tsx` : charger la boutique et la première page de produits
   côté serveur, passer le résultat en props.
2. Garder en client uniquement ce qui a besoin d'interactivité : panier,
   favoris, filtres, défilement infini.
3. Étendre ensuite à `shop/[slug]/products/[productId]`, en veillant à ce que les
   métadonnées Open Graph soient bien remplies côté serveur.

Le tableau de bord marchand est derrière authentification : le rendu serveur y
apporte moins, ce chantier peut y rester optionnel.

**Terminé quand** `curl` sur une URL de boutique renvoie un HTML contenant les
noms et prix des produits.

---

## P2 : fiabilité et qualité perçue

### 7. Ajouter les frontières d'erreur et de chargement

**Constat.** Aucun `error.tsx`, `loading.tsx`, `not-found.tsx` ni
`global-error.tsx` dans toute l'arborescence `src/app`.

Aujourd'hui, une erreur non gérée dans un segment de route affiche l'écran
d'erreur brut de Next.js. Un marchand qui perd sa connexion au milieu d'une
consultation de commandes se retrouve devant une page technique en anglais, sans
moyen de revenir en arrière.

**Action.**

- `app/global-error.tsx` : filet de sécurité racine, avec un bouton de retour au
  tableau de bord.
- `error.tsx` dans `(dashboard)` et dans `shop/[slug]` : message en français,
  bouton « Réessayer » branché sur `reset()`.
- `not-found.tsx` dans `shop/[slug]` : une boutique inexistante ou dépubliée doit
  renvoyer une page claire, pas une erreur.
- `loading.tsx` sur les segments qui deviendront serveur au chantier 6.

---

### 8. Corriger le formatage des montants en FCFA

**Constat.** `src/lib/format.ts` utilise la locale `en-US` :

```ts
return new Intl.NumberFormat("en-US", { ... }).format(safe);
```

Les montants s'affichent donc `1,284,500 CFA`, avec des virgules anglo-saxonnes,
alors que la convention francophone est `1 284 500 CFA` avec une espace
insécable.

C'est un détail visuel, mais il apparaît sur chaque prix, chaque facture et chaque
message WhatsApp envoyé aux clients. Pour un produit qui se positionne comme
« pensé pour l'Afrique francophone », c'est le genre d'incohérence qui se
remarque.

**Action.** Passer la locale à `fr-FR`. La fonction étant partagée par les
commandes, les factures et les emails, ce changement touche l'ensemble du
produit : le faire en une fois, et vérifier au passage qu'aucun test ni aucune
comparaison de chaîne ne dépend du format actuel.

---

### 9. Résorber les 39 erreurs ESLint

**Constat.** Répartition actuelle, hors avertissements :

| Règle | Nombre | Gravité réelle |
|-------|--------|----------------|
| `react/no-unescaped-entities` | 22 | Cosmétique, correction mécanique |
| `@typescript-eslint/no-explicit-any` | 7 | Perte de typage aux frontières |
| `react-hooks/set-state-in-effect` | 7 | **Rendus en cascade, à regarder** |
| `react-hooks/immutability` | 2 | **Mutation d'état, bugs sournois** |
| `@typescript-eslint/no-require-imports` | 1 | Import CommonJS résiduel |

Les 22 premières sont sans risque. Les 9 erreurs de hooks méritent en revanche un
examen : `set-state-in-effect` provoque un second rendu systématique, et
`immutability` signale une mutation directe de l'état, cause classique de
composants qui ne se rafraîchissent pas.

**Action.** Traiter les erreurs de hooks en premier, une par une, en comprenant
chaque cas plutôt qu'en désactivant la règle. Passer ensuite les 22 échappements
de caractères en correction automatique. Terminer par les `any`, en typant les
réponses d'API.

---

## P3 : dette technique

### 10. Découper les fichiers de plus de 1000 lignes

**Constat.** Sept fichiers dépassent 1000 lignes :

```
2089  src/app/(dashboard)/products/page.tsx
1814  src/app/shop/[slug]/products/[productId]/page.tsx
1643  src/app/shop/[slug]/ShopPageClient.tsx
1498  src/app/(dashboard)/orders/page.tsx
1412  src/app/(dashboard)/team/page.tsx
1301  src/app/(dashboard)/settings/page.tsx
1059  src/app/(dashboard)/whatsapp/page.tsx
```

Chacun mélange le balisage, l'état, les appels réseau, et un long bloc de CSS
injecté dans un `<style>`. `src/modules/README.md` annonce un découpage par
domaine métier qui n'a jamais été fait.

**Action.** Ne pas lancer de refonte globale. Découper au fil de l'eau, en
suivant la règle : dès qu'on touche un de ces fichiers pour une fonctionnalité,
on en extrait au moins la partie concernée.

L'ordre le plus rentable, parce qu'il sert aussi d'autres chantiers :

1. Extraire les blocs `<style>` vers les tokens du système de design. Ils
   contiennent encore des valeurs en dur qui doublonnent `globals.css`.
2. Extraire les appels réseau vers des hooks par domaine
   (`useProducts`, `useOrders`), ce qui prépare le chantier 6.
3. Extraire les composants réutilisables (modales, tableaux, filtres).

### 11. Mettre en place une intégration continue

**Constat.** Aucun workflow dans `.github/workflows`. Rien ne vérifie
automatiquement qu'une branche compile avant d'être fusionnée.

**Action.** Un workflow GitHub Actions unique sur `push` et `pull_request` :
`npm ci`, `prisma generate`, `tsc --noEmit`, `eslint`, `next build`, puis les
tests du chantier 4 quand ils existeront.

Comme le projet part de 39 erreurs ESLint, faire échouer la CI sur ESLint dès le
premier jour bloquerait tout. Procéder ainsi : la CI échoue sur `tsc` et `build`
immédiatement, et sur `eslint` une fois le chantier 9 terminé.

**Note.** `prisma generate` doit tourner avant `tsc`. Sans lui, le typage Prisma
est absent et TypeScript remonte des dizaines de fausses erreurs, ce qui s'est
produit lors de cet audit.

---

## Ménage rapide

Sans effort notable, à faire quand l'occasion se présente :

- **`src/app/shop/[slug]/page.tsx.new`** traîne dans le dépôt. Fichier de travail
  laissé de côté, à supprimer ou à finir.
- **Données de démonstration en dur** dans `src/app/(dashboard)/whatsapp/page.tsx`
  (`#WA-1287`, `#WA-1285`, horodatages fixes « Aujourd'hui, 10:27 »). Un marchand
  voit un historique qui n'est pas le sien.
- **`picsum.photos`** est autorisé dans `next.config.ts`. S'il ne sert plus qu'aux
  tests, le retirer de la configuration de production.

---

## Ce que je ne recommande pas

Pour éviter que ces sujets reviennent sans raison :

- **Changer de framework CSS.** Tailwind v4 est en place, les tokens sont posés,
  le problème n'est pas l'outil mais les styles inline qui subsistent.
- **Ajouter une bibliothèque de composants** (shadcn, Radix). `CLAUDE.md`
  l'exclut explicitement, et le système de design actuel couvre les besoins.
- **Introduire un gestionnaire d'état global** (Redux, Zustand). L'état est local
  aux pages. Le vrai besoin est une couche de récupération de données, traitée au
  chantier 10.
- **Migrer vers une architecture microservices.** Le monolithe Next.js convient
  parfaitement à ce volume.

---

## Ordre d'exécution suggéré

Si le temps est compté, cet ordre maximise le rapport valeur sur effort :

1. **Chantier 5** (images). Une journée, effet immédiat sur les commandes, aucun
   risque de régression.
2. **Chantiers 1 et 2** (limitation de débit). Une journée, ferme la porte au
   risque le plus concret.
3. **Chantier 3** (faux avis). Une demi-journée, retire un risque juridique.
4. **Chantier 8** (formatage FCFA) et **7** (frontières d'erreur). Une journée et
   demie, qualité perçue.
5. **Chantiers 11 puis 4** (CI puis tests). La CI d'abord, pour que les tests
   servent à quelque chose dès qu'ils existent.
6. **Chantier 6** (rendu serveur de la vitrine), puis **9** et **10** en continu.

Les quatre premiers points représentent environ quatre jours et couvrent
l'intégralité des risques P0 et P1.

---

## Annexe : méthode

Les chiffres de ce document ont été obtenus ainsi, sur la branche
`redesign/professional-ui` :

| Constat | Commande |
|---------|----------|
| Absence de tests | `find . -name "*.test.*" -o -name "*.spec.*"` hors `node_modules` |
| Absence de CI | `ls .github/workflows` |
| Taille des fichiers | `find src -name "*.tsx" \| xargs wc -l \| sort -rn` |
| Répartition ESLint | `npx eslint src --format json`, agrégé par `ruleId` |
| Couverture du limiteur | `grep -rl "ratelimit" src/app/api` comparé à `find src/app/api -name route.ts` |
| Routes sans authentification | `grep -L "getSessionFromRequest" ` sur les routes non publiques |
| Pages client contre serveur | `grep -L '"use client"'` sur `src/app/**/page.tsx` |
| Frontières d'erreur | `find src/app -name "error.tsx" -o -name "loading.tsx"` |

Toutes les routes sans authentification identifiées sont légitimement publiques
(connexion, inscription, mot de passe oublié, déconnexion, vérification de slug).
**Aucune faille d'autorisation n'a été trouvée** : le contrôle par route,
quoique répétitif, est appliqué partout où il doit l'être.
