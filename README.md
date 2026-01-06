# Chat P2P Décentralisé

Une application de chat peer-to-peer décentralisée construite avec Electron, Vue 3 et GunDB.

## Fonctionnalités

### Communication P2P
- **Chat décentralisé** : Échange de messages en peer-to-peer sans serveur central
- **Chiffrement de bout en bout** : Tous les messages sont chiffrés avec SEA (Security, Encryption, Authorization)
- **Signatures numériques** : Chaque message est signé par l'expéditeur pour garantir l'authenticité

### Transfert de fichiers
- **Envoi de fichiers** : Partagez des fichiers de tout type (max 10 MB)
- **Chiffrement des fichiers** : Les fichiers sont chiffrés avant d'être envoyés
- **Miniatures d'images** : Prévisualisation automatique des images
- **Barre de progression** : Suivi en temps réel de l'upload et du téléchargement

### Gestion des connexions
- **Mode hôte** : Démarrez un serveur Gun local pour héberger le chat
- **Mode client** : Connectez-vous à un serveur existant
- **Détection de connexion** : Indicateur visuel de l'état de connexion
- **Reconnexion automatique** : Tentatives de reconnexion avec backoff exponentiel
- **Déconnexion propre** : Signal de fermeture intentionnelle du serveur

### Interface utilisateur
- **Liste des utilisateurs** : Visualisation en temps réel des participants
- **Indicateur de frappe** : Voyez qui est en train d'écrire
- **Gestion des contacts** : Sauvegardez vos serveurs favoris
- **Historique de connexion** : Accès rapide aux serveurs récemment utilisés
- **Interface sombre** : Design moderne et élégant

## Technologies utilisées

- **Electron** : Framework pour applications desktop multi-plateformes
- **Vue 3** : Framework JavaScript progressif avec Composition API
- **TypeScript** : Typage statique pour JavaScript
- **Pinia** : Gestion d'état moderne pour Vue 3
- **GunDB** : Base de données décentralisée en temps réel
- **SEA (GunDB)** : Chiffrement et authentification

## Installation

### Prérequis
- Node.js (v16 ou supérieur)
- npm ou yarn

### Étapes d'installation

1. Clonez le repository
```bash
git clone <votre-repo>
cd electron
```

2. Installez les dépendances
```bash
npm install
```

3. Lancez l'application en mode développement
```bash
npm run dev
```

4. Construisez l'application pour la production
```bash
# Pour Windows
npm run build:win

# Pour macOS
npm run build:mac

# Pour Linux
npm run build:linux
```

## Utilisation

### Démarrer en tant qu'hôte

1. Lancez l'application
2. Entrez votre nom d'utilisateur
3. Cliquez sur **"Démarrer en tant qu'hôte"**
4. Le serveur démarre automatiquement sur `http://localhost:8765/gun`
5. Partagez cette adresse avec les autres participants

### Se connecter en tant que client

1. Lancez l'application
2. Entrez votre nom d'utilisateur
3. Entrez l'adresse du serveur (ex: `http://192.168.1.100:8765/gun`)
4. Cliquez sur **"Se connecter"**

### Gestion des contacts

- Cliquez sur l'icône d'historique pour ouvrir le panneau de connexions
- Ajoutez un contact avec le bouton **+**
- Marquez vos serveurs préférés en cliquant sur l'étoile
- Double-cliquez sur un contact pour vous connecter rapidement

### Envoyer des messages

- Tapez votre message dans le champ de saisie
- Appuyez sur **Entrée** ou cliquez sur le bouton d'envoi
- Les autres participants verront un indicateur quand vous tapez

### Envoyer des fichiers

1. Cliquez sur l'icône de trombone
2. Sélectionnez votre fichier (max 10 MB)
3. Ajoutez éventuellement un message
4. Cliquez sur envoyer
5. Le fichier sera chiffré et envoyé automatiquement

### Télécharger des fichiers

- Cliquez sur le bouton de téléchargement dans le message
- Le fichier sera déchiffré et sauvegardé dans votre dossier de téléchargements

## Architecture

### Structure du projet

```
electron/
├── src/
│   ├── main/           # Processus principal Electron
│   │   └── index.ts    # Point d'entrée, gestion du serveur Gun
│   ├── preload/        # Scripts de preload pour l'IPC
│   │   └── index.ts    # Bridge entre main et renderer
│   └── renderer/       # Application Vue
│       └── src/
│           ├── components/   # Composants Vue
│           │   ├── ChatRoom.vue
│           │   ├── LoginView.vue
│           │   ├── UserList.vue
│           │   ├── MessageList.vue
│           │   ├── MessageInput.vue
│           │   ├── FileMessage.vue
│           │   ├── ContactList.vue
│           │   └── AddContactModal.vue
│           ├── stores/       # State management (Pinia)
│           │   ├── user.ts
│           │   ├── chat.ts
│           │   ├── connection.ts
│           │   ├── contacts.ts
│           │   └── fileTransfer.ts
│           ├── gun.ts        # Configuration GunDB
│           └── App.vue       # Composant racine
├── gun-data/           # Données Gun (ignoré par git)
└── package.json
```

### Flux de données

1. **Authentification** : L'utilisateur entre son nom → Génération d'une paire de clés SEA
2. **Connexion** :
   - Mode hôte : Démarrage du serveur Gun sur le port 8765
   - Mode client : Connexion au serveur Gun distant
3. **Messages** :
   - Saisie → Chiffrement avec SEA → Signature → Envoi via Gun
   - Réception via Gun → Vérification signature → Déchiffrement → Affichage
4. **Fichiers** :
   - Sélection → Lecture en chunks → Chiffrement → Envoi via Gun
   - Réception via Gun → Déchiffrement → Reconstruction → Téléchargement

### Sécurité

- **Chiffrement de bout en bout** : Utilisation de SEA pour chiffrer tous les messages et fichiers
- **Signatures numériques** : Chaque message est signé pour garantir l'authenticité
- **Clés éphémères** : Les clés sont générées à chaque session (non persistées)
- **Secret partagé** : Utilisation d'un secret commun pour le chiffrement symétrique

## Configuration

### Paramètres modifiables

Dans `src/renderer/src/gun.ts` :
- `MAX_FILE_SIZE` : Taille maximale des fichiers (par défaut 10 MB)
- `CHUNK_SIZE` : Taille des chunks pour l'envoi de fichiers (par défaut 64 KB)

Dans `src/main/index.ts` :
- Port du serveur Gun (par défaut 8765)

## Développement

### Scripts disponibles

```bash
# Développement avec hot-reload
npm run dev

# Build pour production
npm run build

# Build par plateforme
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux

# Linting
npm run lint

# Type checking
npm run typecheck
```

### IDE recommandé

- [VSCode](https://code.visualstudio.com/)
- Extensions :
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
  - [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (pour Vue 3)

## Limitations connues

- Taille maximale des fichiers limitée à 10 MB
- Le serveur Gun doit être accessible via le réseau local ou internet
- Les données ne sont pas persistées après fermeture de l'application (conception éphémère)
- Pas de système de rooms/canaux multiples (un seul chat global)

## Roadmap

- [ ] Système de rooms/canaux multiples
- [ ] Persistance des messages et de l'historique
- [ ] Appels audio/vidéo P2P
- [ ] Partage d'écran
- [ ] Notifications desktop
- [ ] Thème clair/sombre configurable
- [ ] Émojis et réactions aux messages
- [ ] Recherche dans l'historique des messages

## Licence

Ce projet est développé dans un cadre éducatif.

## Support

Pour toute question ou problème, ouvrez une issue sur le repository GitHub.
