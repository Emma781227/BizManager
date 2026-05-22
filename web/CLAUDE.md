@AGENTS.md

# BizManager — Documentation du projet

## Vue d'ensemble

BizManager est une plateforme e-commerce **multi-tenant** destinée aux commerçants africains. Elle permet à chaque marchand de créer une boutique en ligne, gérer son catalogue produits, traiter des commandes et communiquer via WhatsApp.

- **Framework** : Next.js 16 (App Router) avec React 19
- **Langage** : TypeScript (strict mode)
- **Base de données** : PostgreSQL via Prisma ORM
- **Authentification** : JWT avec `jose` + cookies httpOnly
- **Styles** : Tailwind CSS v4
- **Mobile** : Capacitor (Android)
- **Validation** : Zod
- **Emails** : Nodemailer (SMTP)
- **Monnaie** : Franc CFA — utiliser `formatPriceCFA()` de `src/lib/format.ts`
- **Langue de l'UI** : Français (toutes les erreurs et messages en français)

---

## Architecture des dossiers

```
src/
├── app/
│   ├── (auth)/               # Pages publiques d'authentification
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/          # Pages protégées (marchands & admin)
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── admin/
│   │   ├── shops/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── settings/
│   │   ├── whatsapp/
│   │   ├── share/
│   │   ├── MerchantNav.tsx
│   │   └── AdminDashboardClient.tsx
│   ├── shop/
│   │   └── [slug]/           # Vitrine publique de la boutique
│   │       ├── page.tsx
│   │       ├── products/[productId]/
│   │       ├── checkout/
│   │       ├── confirmation/
│   │       └── favorites/
│   ├── api/                  # Routes API (voir section dédiée)
│   ├── layout.tsx            # Layout racine (fonts, PWA, metadata)
│   └── page.tsx              # Landing page marketing
├── lib/
│   ├── auth.ts               # JWT, sessions, cookies
│   ├── prisma.ts             # Singleton Prisma
│   ├── validators.ts         # Schémas Zod
│   ├── shop.ts               # Quotas et résolution de boutique
│   ├── subscription.ts       # Plans et abonnements
│   ├── mailer.ts             # Envoi d'emails
│   ├── format.ts             # formatPrice(), formatPriceCFA()
│   └── notifications.ts      # Alertes stock
├── hooks/
│   └── useActiveShop.ts      # Shop actif (localStorage)
└── styles/
prisma/
├── schema.prisma             # Modèles de données
├── migrations/               # Migrations SQL
└── seed.mjs                  # Données de démarrage
public/
├── uploads/                  # Fichiers uploadés
├── manifest.json             # PWA
└── sw.js                     # Service Worker
```

---

## Routes API (28 routes)

### Authentification (`/api/auth/...`)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/login` | Connexion utilisateur |
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/register/request-code` | Demande code vérification email |
| POST | `/api/auth/forgot-password/request-code` | Demande code reset mot de passe |
| POST | `/api/auth/forgot-password/reset` | Réinitialisation mot de passe |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Session courante |
| POST | `/api/auth/google` | OAuth Google (optionnel) |

### Boutiques
| Méthode | Route | Description |
|---------|-------|-------------|
| GET/POST | `/api/shops` | Liste / créer boutiques |
| GET/PUT/DELETE | `/api/shops/[shopId]` | Détail / modifier / supprimer |
| GET/POST | `/api/shop` | Boutiques de l'utilisateur connecté |
| POST | `/api/shop/check-slug` | Vérifier unicité du slug |

### Produits
| Méthode | Route | Description |
|---------|-------|-------------|
| GET/POST | `/api/products` | Liste / créer produits (multipart/form-data) |
| GET/PUT/DELETE | `/api/products/[productId]` | Détail / modifier / supprimer |

### Commandes
| Méthode | Route | Description |
|---------|-------|-------------|
| GET/POST | `/api/orders` | Liste / créer commandes |
| GET/PUT | `/api/orders/[orderId]` | Détail / modifier commande |

### Clients
| Méthode | Route | Description |
|---------|-------|-------------|
| GET/POST | `/api/customers` | Liste / créer clients |

### API Publiques (sans authentification)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/public/shop/[slug]` | Info boutique publique |
| GET | `/api/public/shop/[slug]/products` | Produits de la boutique |
| GET | `/api/public/shop/[slug]/products/[productId]` | Détail produit |
| POST | `/api/public/shop/[slug]/orders` | Créer commande (vitrine) |
| POST | `/api/public/shop/[slug]/whatsapp` | Webhook WhatsApp |

### Admin
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/admin/overview` | Statistiques plateforme |
| GET | `/api/admin/shops` | Toutes les boutiques |

### Utilitaires
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard` | Métriques tableau de bord |
| POST | `/api/whatsapp/preview` | Aperçu message WhatsApp |
| GET/POST | `/api/subscription` | Abonnement utilisateur |

---

## Schéma de base de données

### Enums
- **UserRole** : `merchant`, `admin`
- **SubscriptionStatus** : `trialing`, `active`, `cancelled`, `expired`
- **ShopStatus** : `active`, `inactive`, `suspended`, `closed`
- **OrderStatus** : `pending`, `new`, `confirmed`, `in_progress`, `ready`, `delivered`, `cancelled`
- **OrderChannel** : `whatsapp`, `online`, `manual`
- **PaymentStatus** : `unpaid`, `partial`, `paid`, `refunded`
- **PaymentMethod** : `cash`, `mobile_money`, `bank_transfer`, `cod`
- **WhatsappLogType** : `relance`, `confirmation`, `custom`, `template`

### Modèles principaux
| Modèle | Description | Champs clés |
|--------|-------------|-------------|
| `User` | Comptes marchands/admin | email (unique), role, passwordHash |
| `PendingRegistration` | Vérification email à l'inscription | code, expiresAt |
| `PendingPasswordReset` | Reset mot de passe | code, expiresAt |
| `Plan` | Plans d'abonnement | name (unique), maxShops, maxProducts, priceMonthly |
| `Subscription` | Abonnement utilisateur | userId (unique), planId, status, expiresAt |
| `Shop` | Boutiques marchandes | slug (unique), userId, whatsappNumber, status |
| `Product` | Produits | shopId, unitPrice (Decimal), stock, imageUrl, hasVariants |
| `ProductVariant` | Variantes d'un produit | productId, label, stock, priceOverride (Decimal?) |
| `Customer` | Clients d'une boutique | shopId, phone, email |
| `Order` | Commandes | shopId, customerId, status, paymentStatus, totalAmount |
| `OrderItem` | Lignes de commande | orderId, productId, variantId?, variantLabel?, quantity, unitPrice, lineTotal |
| `OrderStatusHistory` | Historique des statuts de commande | orderId, status (OrderStatus), changedAt, note? |
| `WhatsappLog` | Historique messages WhatsApp | shopId, orderId, type, message |

### Plans d'abonnement
| Plan | Boutiques | Produits | Prix mensuel |
|------|-----------|----------|--------------|
| `starter` | 1 | 20 | Gratuit |
| `business` | 3 | 500 | 4 500 CFA |
| `premium` | 10 | Illimité | 10 000 CFA |

---

## Authentification

**Implémentation** : JWT via `jose`, cookie httpOnly `session`, expiration 7 jours.

**Fonctions clés** (`src/lib/auth.ts`) :
- `signSession(payload)` — Créer un token JWT
- `verifySession(token)` — Valider un token
- `setSessionCookie(res, token)` — Écrire le cookie
- `clearSessionCookie(res)` — Supprimer le cookie
- `getSessionFromRequest(req)` — Extraire la session (NextRequest)
- `getSessionFromCookieStore()` — Extraire la session (Server Component)
- `isPlatformAdmin(user)` — Vérifier si admin (rôle DB ou email dans `PLATFORM_ADMIN_EMAILS`)

**Pas de middleware global** — chaque route API et le layout dashboard vérifient l'auth individuellement.

---

## Variables d'environnement requises

```env
# Base de données
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"

# Authentification
JWT_SECRET="chaine-secrete-min-32-caracteres"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Admin plateforme (séparés par virgule)
PLATFORM_ADMIN_EMAILS="email@exemple.com"

# SMTP (email)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="email@gmail.com"
SMTP_PASS="mot-de-passe-app"
SMTP_FROM="BizManager <email@gmail.com>"

# WhatsApp Cloud API (optionnel)
WHATSAPP_CLOUD_ACCESS_TOKEN=""
WHATSAPP_CLOUD_PHONE_NUMBER_ID=""

# Cloudinary (stockage images/vidéos produits)
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
```

---

## Conventions importantes

### Fichiers média (produits)
- Upload via `multipart/form-data`
- Taille max : 20 Mo par fichier
- Stockés sur **Cloudinary** — les URLs `secure_url` Cloudinary sont sauvegardées en base
- Dossier Cloudinary : `bizmanager/products`
- Fonction d'upload : `uploadMedia(file, folder?)` dans `src/lib/cloudinary.ts`
- Déclaration obligatoire : `export const runtime = "nodejs"` sur les routes qui gèrent les uploads

### Validation
- Toujours utiliser les schémas Zod de `src/lib/validators.ts`
- Messages d'erreur en **français**
- Valider à la frontière système (input utilisateur, APIs externes)

### Quotas
- Vérifier les quotas via `checkShopQuota()` et `checkProductQuota()` de `src/lib/shop.ts` avant création
- Les quotas dépendent du plan d'abonnement actif de l'utilisateur

### Prisma
- Utiliser le singleton : `import prisma from "@/lib/prisma"`
- Ne jamais instancier `new PrismaClient()` directement
- Les prix sont des `Decimal` Prisma — sérialiser avec `.toString()` ou `.toNumber()` avant envoi JSON

### Style et UI
- Tailwind CSS v4 (nouvelle syntaxe — pas de `tailwind.config.js`)
- Icônes : `lucide-react`
- Pas de composants UI tiers (pas de shadcn, pas de radix)
- Interface en **français**

### Hooks React
- `useActiveShop()` — Récupère la boutique active depuis `localStorage`

---

## Commandes utiles

```bash
# Développement
npm run dev          # Démarrer le serveur (Turbopack)

# Base de données
npx prisma migrate dev    # Appliquer les migrations
npx prisma db seed        # Seeder la base
npx prisma studio         # Interface graphique DB

# Build
npm run build
npm run start
```

---

## Notes spécifiques à ce Next.js

> Voir AGENTS.md — cette version a des changements majeurs par rapport aux versions précédentes. Lire `node_modules/next/dist/docs/` avant d'écrire du code.

- `next@16.2.1` avec React 19 et React Compiler activé
- Turbopack configuré comme bundler de développement
- App Router uniquement (pas de Pages Router)
- Server Components par défaut — ajouter `"use client"` uniquement si nécessaire
