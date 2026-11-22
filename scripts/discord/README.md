# Discord Rich Presence (PreMiD) — dev

Prérequis : Discord desktop ouvert, extension PreMiD installée.

1. Cloner le repo PreMiD et installer les dépendances :
   ```sh
   git clone https://github.com/PreMiD/Activities.git
   cd Activities
   npm install
   ```
2. Copier l'activity :
   ```sh
   cp -r <ft_transcendence>/scripts/discord/Flex websites/F/Flex
   ```
3. Lancer le mode dev :
   ```sh
   npx pmd dev "Flex"
   ```
4. Dans les réglages de l'extension PreMiD, activer **Activity Developer Mode**.
5. Ouvrir Flex sur `localhost` et lancer une musique : le statut Discord se met à jour.

> L'app doit être ouverte via `localhost` ou `127.0.0.1`. Pour une autre URL, modifier `url` et `regExp` dans `Flex/metadata.json`.
