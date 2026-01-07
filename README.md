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
- [ ] **Système d'ID décentralisé pour la découverte de peers**

## Évolutions futures

### Système d'ID décentralisé (DID - Decentralized Identity)

**Problématique actuelle** : Les utilisateurs doivent connaître et saisir l'adresse IP:port du serveur pour se connecter, ce qui est peu pratique et limite l'adoption.

**Solution proposée** : Implémenter un système d'identifiants uniques et mémorables pour découvrir et se connecter aux peers sans connaître leur adresse IP.

#### Architecture envisagée

##### 1. Génération d'identifiants uniques

```typescript
// Lors de la création d'un serveur
interface PeerIdentity {
  id: string              // ID unique (ex: "alice-chat-2024")
  publicKey: string       // Clé publique SEA du peer
  endpoints: string[]     // Liste des adresses accessibles
  timestamp: number       // Date de création/mise à jour
  signature: string       // Signature cryptographique
}
```

**Avantages** :
- Identifiants mémorables générés automatiquement ou personnalisables
- Vérification cryptographique de l'authenticité du peer
- Support multi-adresses (IPv4, IPv6, domaine)

##### 2. Annuaire décentralisé (DHT - Distributed Hash Table)

Utiliser une DHT (comme celle de GunDB ou intégrer libp2p) pour enregistrer et découvrir les peers :

```typescript
// Enregistrement du serveur dans la DHT
gun.get('peer-registry').get(peerId).put({
  id: 'alice-chat-2024',
  publicKey: keyPair.pub,
  endpoints: [
    'http://192.168.1.100:8765/gun',
    'https://alice.dyndns.org:8765/gun'
  ],
  lastSeen: Date.now(),
  signature: await SEA.sign(data, keyPair)
})

// Découverte d'un peer par ID
gun.get('peer-registry').get('alice-chat-2024').once((peerData) => {
  // Vérifier la signature
  const isValid = await SEA.verify(peerData.signature, peerData.publicKey)

  if (isValid) {
    // Tenter la connexion aux endpoints disponibles
    connectToPeer(peerData.endpoints)
  }
})
```

**Avantages** :
- Aucun serveur centralisé nécessaire
- Résilience (si un nœud tombe, les autres maintiennent l'annuaire)
- Mise à jour automatique des adresses IP (utile pour IP dynamiques)

##### 3. Serveurs de rendez-vous (Bootstrap nodes)

Pour faciliter la découverte initiale, maintenir quelques serveurs de bootstrap publics :

```typescript
const BOOTSTRAP_PEERS = [
  'https://gun-relay-1.herokuapp.com/gun',
  'https://gun-relay-2.herokuapp.com/gun',
  'https://custom-bootstrap.example.com/gun'
]

// Se connecter aux bootstraps pour découvrir d'autres peers
gun.opt({ peers: BOOTSTRAP_PEERS })
```

**Avantages** :
- Découverte automatique des peers au démarrage
- Pas besoin de connaître une adresse IP pour commencer
- Les bootstraps servent de relais temporaires

##### 4. Interface utilisateur simplifiée

Modifier l'écran de connexion pour permettre :

```
┌─────────────────────────────────────┐
│  Se connecter                       │
├─────────────────────────────────────┤
│  Mon ID: alice-chat-2024            │  [Éditer]
│                                     │
│  Rejoindre un ami:                  │
│  ┌─────────────────────────────┐   │
│  │ bob-chat-2024               │   │  [Rechercher]
│  └─────────────────────────────┘   │
│                                     │
│  Ou utiliser une adresse IP:       │
│  ┌─────────────────────────────┐   │
│  │ 192.168.1.100:8765          │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### Implémentation technique

##### Option 1 : Gun.js natif avec DHT

- Utiliser le système de réplication de Gun comme DHT naturelle
- Chaque peer publie son identité sur `gun.get('peer-registry')`
- Les peers se synchronisent automatiquement via les relais Gun

**Avantages** : Simplicité, cohérence avec l'architecture actuelle
**Inconvénients** : Nécessite des relais Gun publics

##### Option 2 : Intégration libp2p

- Utiliser libp2p pour la découverte de peers (mDNS, DHT Kademlia)
- Garder Gun pour la synchronisation des données
- Combinaison des deux protocoles

**Avantages** : Découverte automatique sur réseau local (mDNS), DHT robuste
**Inconvénients** : Complexité accrue, deux systèmes à maintenir

##### Option 3 : Serveur de signalement léger (Hybrid)

- Maintenir un serveur HTTP simple pour l'enregistrement des peers
- Les peers s'enregistrent avec leur ID et endpoints
- Communication P2P directe via Gun après découverte

**Avantages** : Simple à implémenter, fiable
**Inconvénients** : Nécessite un serveur (même léger)

#### Flux utilisateur proposé

1. **Première utilisation** :
   - L'utilisateur lance l'app
   - Un ID unique est généré automatiquement (ex: `user-abc123`)
   - Possibilité de personnaliser l'ID

2. **Démarrage du serveur** :
   - L'utilisateur clique sur "Démarrer un serveur"
   - L'app enregistre automatiquement l'ID dans la DHT avec les endpoints
   - L'ID est affiché et un QR code est généré

3. **Connexion à un ami** :
   - L'utilisateur saisit l'ID de son ami (ex: `bob-chat-2024`)
   - L'app recherche dans la DHT les endpoints correspondants
   - Connexion automatique au meilleur endpoint disponible

4. **Mise à jour automatique** :
   - Si l'IP change (DHCP, déplacement), l'app met à jour la DHT
   - Les clients connectés reçoivent automatiquement la nouvelle adresse

#### Sécurité et considérations

- **Vérification d'identité** : Toujours vérifier la signature cryptographique
- **Protection contre le spoofing** : Seul le détenteur de la clé privée peut mettre à jour son entrée
- **Expiration des entrées** : Supprimer les peers inactifs après X jours
- **Liste noire** : Permettre aux utilisateurs de bloquer des IDs spécifiques
- **Chiffrement des endpoints** : Éviter d'exposer publiquement toutes les adresses IP

Cette approche transformerait l'application d'un système basé sur IP/port vers un système basé sur identités, similaire à Signal, Telegram ou autres applications modernes de messagerie, tout en conservant les avantages du P2P décentralisé.

## Licence

Ce projet est développé dans un cadre éducatif.

## Support

Pour toute question ou problème, ouvrez une issue sur le repository GitHub.
