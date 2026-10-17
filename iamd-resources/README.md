# IAMD Resources

Plateforme web de ressources pédagogiques pour les étudiants du Master Intelligence Artificielle et Modélisation des Données (IAMD) : cours, résumés, exercices corrigés, TP, projets et sujets d'examens, organisés par **formation → niveau → semestre → matière → chapitre**.

- Consultation publique, sans compte. Un compte (facultatif) donne accès aux favoris et à l'historique.
- Espace administrateur sécurisé : matières, chapitres, documents, projets, formations/niveaux, publication, statistiques, rôles.
- Les 12 matières créées au départ sont des **catégories indicatives, pas le programme officiel** : l'administrateur peut les modifier ou les supprimer.

## Architecture

| Couche | Choix |
| --- | --- |
| Interface | Next.js 16 (App Router, TypeScript), Tailwind CSS 4, icônes lucide-react |
| Serveur | Server Components, Server Actions, route `/api/ressources/[id]/fichier` |
| Données | PostgreSQL (Supabase) : schéma, règles RLS, recherche plein texte, statistiques |
| Authentification | Supabase Auth (e-mail + mot de passe), rôles `admin` / `student` |
| Fichiers | Supabase Storage, bucket privé `documents`, accès par URL signée de courte durée |
| Validation | Zod (formulaires, paramètres d'URL), vérification du contenu réel des fichiers |
| Tests | Vitest (unitaires + intégration sur la base réelle), Playwright (bout en bout) |

```
src/
  app/                 pages publiques, espace personnel, /admin, actions serveur
  components/          interface (cartes, recherche, formulaires…)
  lib/                 accès aux données, validation, règles de fichiers, auth
  proxy.ts             rafraîchissement de session + redirection des pages protégées
supabase/migrations/   schéma, RLS, stockage, recherche, catalogue initial
scripts/create-admin.mjs
tests/                 unit/, integration/, e2e/
```

### Sécurité

- **Toutes les écritures sont réservées aux administrateurs dans la base elle-même** (Row Level Security) : masquer un bouton n'est jamais la seule protection. Chaque page et action d'administration revérifie en plus le rôle côté serveur.
- Un utilisateur ne peut pas modifier son propre rôle (droits de colonne + déclencheur) ; le dernier administrateur ne peut pas être rétrogradé.
- Brouillons, matières et formations dépubliées sont invisibles pour le public, y compris leurs fichiers dans le stockage.
- Téléversements : liste blanche d'extensions (PDF, ZIP, CSV, IPYNB, JSON, TXT, MD, PY, R, DOCX, PPTX, XLSX, PNG, JPG, WEBP), tailles maximales par format (50 Mo max), types MIME imposés par le bucket, **vérification de la signature binaire / de l'encodage après envoi** (un faux PDF est supprimé et refusé). HTML, SVG et exécutables sont interdits.
- Les fichiers sont envoyés directement du navigateur vers le stockage via une URL de dépôt signée délivrée par le serveur après contrôle (pas de limite de 4,5 Mo de Vercel).
- Aucune clé secrète dans l'application : seule la clé publique Supabase est utilisée. La clé secrète ne sert qu'au script de création d'administrateur et aux tests.
- En-têtes de sécurité (`X-Frame-Options`, `nosniff`, `Referrer-Policy`…), protection contre les redirections ouvertes, obligation de citer la source et de confirmer les droits de diffusion de chaque document.

## Lancer le site en local

Prérequis : Node.js ≥ 20.9, Docker (pour Supabase local).

```bash
cd iamd-resources
npm install
npx supabase start          # démarre PostgreSQL, Auth, Storage et applique les migrations
npx supabase status -o env  # affiche API_URL, PUBLISHABLE_KEY et SECRET_KEY
cp .env.example .env.local  # puis renseigner les valeurs affichées ci-dessus
npm run create-admin -- vous@exemple.dj --password "UnMotDePasseSolide1"
npm run dev                 # http://localhost:3000
```

Connectez-vous avec ce compte : le bouton **Administration** apparaît dans l'en-tête.

Commandes utiles :

| Commande | Rôle |
| --- | --- |
| `npm run build && npm start` | build et serveur de production |
| `npm run lint` / `npm run typecheck` | qualité du code |
| `npm test` | tests unitaires |
| `node --env-file=.env.local node_modules/.bin/vitest run tests/integration` | tests d'intégration (Supabase local requis) |
| `node --env-file=.env.local node_modules/.bin/playwright test` | tests de bout en bout (Supabase local + Chromium) |
| `npm run db:reset` | réinitialise la base locale (efface les données) |
| `npm run db:types` | régénère `src/lib/database.types.ts` après une migration |

## Variables d'environnement

| Variable | Où | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | local + Vercel | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | local + Vercel | clé publique (« publishable », ou l'ancienne « anon » via `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `NEXT_PUBLIC_SITE_URL` | local + Vercel | URL publique du site (liens d'e-mail, métadonnées) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | local + Vercel | contact affiché dans le pied de page et les mentions légales |
| `SUPABASE_SECRET_KEY` | **local uniquement** | clé secrète, pour `create-admin` et les tests. Ne jamais la mettre sur Vercel ni dans Git |

## Créer le premier compte administrateur

Deux méthodes :

1. **Script** (recommandé) : `npm run create-admin -- email@exemple.dj --password "…"` avec `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SECRET_KEY` du projet visé dans `.env.local`. Le compte est créé s'il n'existe pas, puis promu administrateur.
2. **SQL** : inscrivez-vous sur `/inscription`, confirmez l'e-mail, puis dans Supabase → SQL Editor :
   ```sql
   update public.profiles set role = 'admin' where email = 'email@exemple.dj';
   ```

Ensuite, les autres administrateurs se nomment depuis **Administration → Utilisateurs**.

## Mise en ligne (Supabase + Vercel)

1. **Supabase** : créez un projet sur [supabase.com](https://supabase.com) (région proche de vos utilisateurs, par ex. Europe).
2. **Appliquer le schéma** depuis votre poste :
   ```bash
   npx supabase login
   npx supabase link --project-ref <REF_DU_PROJET>
   npx supabase db push        # applique supabase/migrations (tables, RLS, bucket, catalogue)
   ```
3. **Auth** (Supabase → Authentication) :
   - *URL Configuration* : *Site URL* = `https://votre-domaine` ; *Redirect URLs* : `https://votre-domaine/**`.
   - *Email* : laissez la confirmation d'e-mail activée et modifiez le modèle « Confirm signup » pour utiliser
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/espace`.
   - Pour un usage réel, configurez un SMTP personnalisé (le service intégré est très limité en volume).
4. **Vercel** : importez le dépôt GitHub, choisissez `iamd-resources` comme *Root Directory*, ajoutez les variables `NEXT_PUBLIC_*` ci-dessus, puis déployez. Vercel détecte Next.js automatiquement.
5. **Premier administrateur** : `npm run create-admin` en pointant `.env.local` vers le projet Supabase de production (clé secrète gardée sur votre poste).
6. Complétez la page **Mentions légales** (éditeur, hébergeur, contact) et définissez `NEXT_PUBLIC_CONTACT_EMAIL`.

Alternative à Vercel : tout hébergeur Node.js (`npm run build && npm start`, port 3000) ou Netlify.

## Droits d'auteur

Ne publiez que des documents que vous êtes autorisé à diffuser (accord de l'auteur ou licence libre). Chaque ressource exige une source et une confirmation des droits ; pour un support protégé, ajoutez plutôt un lien vers sa source officielle. Les fiches d'illustration doivent être marquées « Exemple fictif » (c'est le cas de l'unique projet d'exemple fourni, qui ne contient ni rapport ni résultat).

## Limites connues

- Pas de réinitialisation de mot de passe dans l'interface (à faire depuis Supabase) ni de suppression de compte depuis l'administration (Supabase → Authentication → Users).
- La recherche fait des correspondances par préfixe, sans accents ni casse ; elle n'utilise pas de racinisation (« régression » trouve « régressions », mais pas l'inverse).
- Les pages introuvables affichent une page 404 avec `noindex`, mais avec un statut HTTP 200 à cause du rendu en streaming.
