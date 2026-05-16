# Mon Budget — Application de gestion de budget personnel

Application web 100 % front-end pour suivre ses dépenses et revenus au quotidien.
Aucun serveur, aucune installation — ouvrir `index.html` directement dans le navigateur.

## Déploiement

| | |
|---|---|
| Dépôt | https://github.com/Dazhko/mon-budget |
| Site en ligne | https://dazhko.github.io/mon-budget/ |
| Hébergement | GitHub Pages — branche `main`, dossier racine `/` |
| HTTPS | Forcé |

Tout push sur `main` déclenche un rebuild automatique de Pages (workflow GitHub géré, visible dans l'onglet **Actions**).

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Structure | HTML5 sémantique |
| Style | CSS3 — variables custom, Flexbox, Grid, responsive |
| Logique | JavaScript ES6+ — `'use strict'`, pas de modules |
| Persistance | `localStorage` (`monBudget_transactions`) |
| Graphiques | Chart.js 4.4.0 via CDN JSDelivr |

## Structure des fichiers

```
mon-budget/
├── index.html                  # Point d'entrée unique — toute la structure HTML + balises meta
├── style.css                   # Design system complet (variables, composants, responsive)
├── app.js                      # Logique applicative — état, CRUD, rendu, événements
├── og-image.png                # Image Open Graph 1200×630 pour partage social
├── generate-og.ps1             # Script PowerShell de génération de l'image OG (System.Drawing)
├── og-design-philosophy.md     # Direction artistique de l'image OG (« Quiet Ledger »)
├── .gitignore                  # Fichiers à ignorer (.vscode, *.log, etc.)
└── CLAUDE.md                   # Ce fichier
```

## Architecture de app.js

Le fichier suit une organisation en couches séquentielles, sans classes :

```
Constantes (CLE_STORAGE, CATEGORIES, COULEURS_GRAPHIQUE)
  └── État global (transactions[], graphique, idASupprimer)
        └── LocalStorage  (chargerTransactions, sauvegarderTransactions)
              └── Calculs purs (calculerTotaux, formaterMontant, formaterDate)
                    └── Rendu DOM (mettreAJourTableauBord, mettreAJourGraphique, rendreHistorique)
                          └── Handlers (ajouterTransaction, demanderSuppression, confirmerSuppression)
                                └── Initialisation (initialiser → appel unique au chargement)
```

`rendreApp()` orchestre les trois fonctions de rendu en un seul appel.

## Modèle de données

Clé LocalStorage : `monBudget_transactions` → tableau JSON.

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "depense",
    "montant": 42.50,
    "categorie": "alimentation",
    "date": "2026-05-15",
    "description": "Courses Lidl"
  }
]
```

| Champ | Type | Valeurs |
|-------|------|---------|
| `id` | string | `crypto.randomUUID()` — fallback `Date.now() + Math.random()` |
| `type` | string | `"depense"` \| `"revenu"` |
| `montant` | number | Positif, arrondi à 2 décimales (`Math.round(x * 100) / 100`) |
| `categorie` | string | `alimentation` · `logement` · `transport` · `loisirs` · `santé` · `autres` |
| `date` | string | ISO `YYYY-MM-DD` |
| `description` | string | Texte libre ≤ 100 caractères, peut être vide |

## Fonctionnalités implémentées

### Tableau de bord (3 cartes)
- **Solde actuel** — `revenus − dépenses`, toutes périodes confondues
- **Total revenus** — somme de toutes les entrées de type `revenu`
- **Total dépenses** — somme de toutes les entrées de type `depense`

### Graphique
- Donut Chart.js — répartition des **dépenses** par catégorie
- Masqué automatiquement si aucune dépense n'existe
- Tooltip affichant le montant formaté en euros

### Formulaire d'ajout
- Sélecteur type via boutons radio stylisés (dépense / revenu)
- Champs : montant, catégorie, date (pré-remplie au jour courant), description
- Validation : montant > 0, date obligatoire
- Réinitialisation partielle après soumission (montant + description vidés, focus replacé)

### Historique
- Trié par date décroissante
- Filtres combinables : type · catégorie · mois (filtre mois pré-réglé sur le mois courant)
- Icône et badge coloré par catégorie
- Signe `+` / `−` et couleur verte / rouge selon le type
- Suppression via bouton ✕ avec modale de confirmation

### Modale de confirmation
- Fond flouté (`backdrop-filter: blur`)
- Fermeture en cliquant en dehors de la modale

## SEO et partage social

Toutes les balises meta sont concentrées dans le `<head>` de `index.html` :

- **Référencement** — `description`, `keywords`, `author`, `robots`, `canonical`
- **UI mobile** — `theme-color` (`#6366f1`, couleur primaire)
- **Favicon** — SVG inline (data URI) avec emoji 💰, zéro requête réseau
- **Open Graph** — `og:type`, `og:title`, `og:description`, `og:url`, `og:site_name`, `og:locale`, `og:image` (+ `width`/`height`/`alt`)
- **Twitter Card** — `summary_large_image` avec `twitter:image`

L'image OG (`og-image.png`, 1200×630) est générée par `generate-og.ps1` via `System.Drawing` (.NET natif Windows). Elle reprend la charte graphique : titre, tagline, mockup des trois cartes solde / revenus / dépenses avec leurs accents indigo / vert / corail. Pour la régénérer après modification du script :

```
powershell -ExecutionPolicy Bypass -File generate-og.ps1
```

## Responsive

| Breakpoint | Comportement |
|------------|--------------|
| ≥ 769 px   | Layout 3 colonnes pour le tableau de bord, 2 colonnes graphique + formulaire |
| ≤ 768 px   | Toutes les grilles passent en colonne unique. `font-size: 16px` forcé sur les inputs pour empêcher le zoom automatique d'iOS Safari au focus |
| ≤ 480 px   | Paddings réduits, filtres d'historique empilés à 100 % de largeur |

## Conventions de code

- `'use strict'` en tête de `app.js`
- **Fonctions** : camelCase français (`ajouterTransaction`, `rendreHistorique`, `mettreAJourGraphique`)
- **Constantes** : SCREAMING_SNAKE_CASE (`CLE_STORAGE`, `CATEGORIES`, `COULEURS_GRAPHIQUE`)
- **Classes CSS** : BEM français (`transaction__icone`, `carte--solde`, `bouton-modale--confirmer`)
- **Variables CSS** : `--couleur-*`, `--rayon`, `--ombre`, `--transition` dans `:root`
- Pas de manipulation du DOM depuis `style.css` ; tout le rendu passe par `app.js`
- `echapper()` utilisé systématiquement avant injection de contenu utilisateur dans le HTML
- Une seule instance Chart.js — détruite et recréée à chaque mise à jour (`graphique.destroy()`)

## Lancer le projet

**En ligne** : https://dazhko.github.io/mon-budget/ (toujours à jour avec `main`)

**En local** : ouvrir `index.html` dans Chrome, Firefox ou Edge — aucune installation requise.

## Tests manuels

| Scénario | Résultat attendu |
|----------|-----------------|
| Ajouter une dépense | Solde diminue, transaction dans l'historique, graphique mis à jour |
| Ajouter un revenu | Solde augmente, badge vert dans l'historique |
| Monter invalide (0 ou vide) | Message d'erreur rouge, transaction non créée |
| Filtrer par catégorie | Seules les transactions correspondantes s'affichent |
| Filtrer par mois | Seules les transactions du mois sélectionné s'affichent |
| Supprimer → Annuler | Transaction conservée |
| Supprimer → Confirmer | Transaction supprimée, solde et graphique recalculés |
| Recharger la page | Toutes les données persistent via `localStorage` |
| `localStorage` vide (DevTools) | L'application démarre sans erreur avec état vide |
