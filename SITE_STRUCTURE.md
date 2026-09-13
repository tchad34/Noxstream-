# NoxStream — Structure du site

## Accueil
- Barre de navigation Premium
- Hero et mise en avant
- Films récents
- En ce moment au cinéma
- Catalogue complet
- Filtres par genre
- Recherche
- Navigation mobile

## Catalogue
- Une fiche par film
- Recherche par titre
- Filtres
- Tri des sorties récentes
- Déduplication par titre normalisé

## Fiche film
- Affiche originale
- Titre, année, genre, durée
- Langue et origine
- Réalisateur
- Acteurs
- Synopsis
- Bande-annonce lorsqu'elle est configurée
- Lecteur vidéo
- Sources disponibles
- Partage
- Liste personnelle
- Reprise de lecture

## Lecteur
- Résolution maximale disponible sélectionnée automatiquement
- Lecture avec gestion Range
- Proxy `/api/video`
- Conservation des en-têtes vidéo utiles
- CORS et Cross-Origin-Resource-Policy

## Cinéma
- Section « En ce moment au cinéma »
- Priorité aux sorties récentes
- Pas de doublons
- Conservation des fiches existantes

## Catalogue externe
Le worker charge `/films/catalog.json` et fusionne les fiches par titre normalisé. Une fiche existante est complétée plutôt que recréée.

## Affiches
Le site conserve les fichiers originaux. Les deux emplacements R2 sont compatibles :
- `Image noxstream/`
- racine du bucket

## Pop-up d'installation
Le parcours d'installation de l'application NoxStream doit rester présent et séparé du contenu du catalogue. Le refus ferme le pop-up sans bloquer le site.

## Compatibilité
- Ordinateur
- Mobile
- Tablette
- Interface française

## Principe de modification
`index.html` constitue la base visuelle Premium existante. Les fonctions périphériques sont ajoutées via le worker ou des fichiers dédiés afin de limiter les régressions visuelles.
