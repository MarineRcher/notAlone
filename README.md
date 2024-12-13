Pour demarrer le projet, il faut etre a la racine du projet et lancer la commande :

```
make
```

# Frontend

## Structure des dossiers

```
root
│
├── __tests__/             # Tests unitaires et de composants
│   └── ...
├── android/               # Code natif Android
├── ios/                   # Code natif iOS
├── assets/                # Fichiers de ressources (images, polices, etc.)
│   ├── images/
│   └── fonts/
├── src/                   # Code source principal
│   ├── api/               # Services API et fichiers de configuration
│   │   └── apiClient.ts
│   ├── components/        # Composants réutilisables
│   │   ├── Atoms
│   │   │   └──Button
│   │   │      ├──Button.tsx
│   │   │      ├──Button.types.ts
│   │   │      ├──Button.style.ts
│   │   │      └──Index.ts
│   │   ├── Moleculs
│   │   ├── Organisms
│   │   └── Templates
│   ├── screens/           # Pages de l'application
│   │   ├── HomeScreen.ts
│   │   └── ProfileScreen.ts
│   ├── navigation/        # Gestion de la navigation
│   │   └── AppNavigator.ts
│   ├── hooks/             # Hooks personnalisés
│   │   └── useAuth.ts
│   ├── utils/             # Utilitaires et fonctions helpers
│   │   └── formatDate.ts
│   ├── styles/            # Fichiers de styles globaux
│   │   └── colors.ts
│   └── store/             # Gestion de l'état global (Redux, Zustand, etc.)
│       └── index.ts
│
│
├── package.json           # Dépendances et scripts du projet
├── app.json               # Configuration de l'application
└── App.tsx                # Point d'entrée principal de l'application

```
