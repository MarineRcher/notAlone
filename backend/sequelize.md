# Guide Complet Sequelize : Models, Migrations et Seeders (Cas d'Usage Complets)

## Table des Matières
1. [Workflow Complet](#workflow-complet)
2. [Models Avancés](#models-avancés)
3. [Migrations Complexes](#migrations-complexes)
4. [Seeders Complets](#seeders-complets)
5. [Cas d'Usage Spécifiques](#cas-dusage-spécifiques)
6. [Bonnes Pratiques](#bonnes-pratiques)
7. [Dépannage](#dépannage)

---

## Workflow Complet

### 1. Initialisation d'une nouvelle entité

```bash
# 1. Créer le modèle (User.ts)
touch src/models/User.ts

# 2. Générer la migration
npm run migrate:generate --name create-user-table

# 3. Générer le seeder de base
npm run seed:generate --name initial-users
```

### 2. Cycle de développement standard

1. Modifier le modèle
2. Créer/modifier une migration
3. Exécuter les migrations
4. Créer/modifier les seeders
5. Tester

```bash
# Workflow complet
npm run migrate:generate --name add-new-feature
npm run migrate
npm run seed:generate --name test-new-feature
npm run seed:all
```

---

## Models Avancés

### Modèle complet avec relations et hooks

```typescript
// src/models/User.ts
import { Model, DataTypes, Optional, Association } from 'sequelize';
import db from '../config/database';
import Post from './Post';
import Role from './Role';

interface UserAttributes {
  id: number;
  email: string;
  // ... autres attributs
}

class User extends Model<UserAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  
  // Timestamps automatiques
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null; // Pour soft delete

  // Relations
  public readonly posts?: Post[];
  public readonly roles?: Role[];

  // Déclaration des associations
  public static associations: {
    posts: Association<User, Post>;
    roles: Association<User, Role>;
  };

  // Méthodes personnalisées
  public hasRole(roleName: string): boolean {
    return this.roles?.some(role => role.name === roleName) || false;
  }
}

User.init({
  email: {
    type: DataTypes.STRING,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  // ... autres champs
}, {
  sequelize: db,
  modelName: 'User',
  tableName: 'users',
  paranoid: true, // Active le soft delete
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await hashPassword(user.password);
      }
    },
    afterCreate: (user) => {
      sendWelcomeEmail(user.email);
    }
  },
  defaultScope: {
    attributes: { exclude: ['password'] } // Ne pas retourner le mot de passe par défaut
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] }
    }
  }
});

// Relations (à faire après tous les modèles sont importés)
User.associate = () => {
  User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
  User.belongsToMany(Role, { through: 'UserRoles', as: 'roles' });
};

export default User;
```

---

## Migrations Complexes

### Migration complète avec transactions et relations

```typescript
// src/migrations/XXXXXX-create-complex-tables.ts
import { QueryInterface, DataTypes, Transaction } from 'sequelize';

export = {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Création table principale
      await queryInterface.createTable('users', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        // ... autres champs
      }, { transaction });

      // 2. Création table liée
      await queryInterface.createTable('posts', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        authorId: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        // ... autres champs
      }, { transaction });

      // 3. Ajout index
      await queryInterface.addIndex(
        'posts',
        ['authorId'],
        { transaction, name: 'posts_author_id' }
      );

      // 4. Ajout contrainte unique complexe
      await queryInterface.addConstraint('users', {
        fields: ['email', 'tenant_id'],
        type: 'unique',
        name: 'unique_email_per_tenant',
        transaction
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface: QueryInterface) {
    // L'ordre est important pour les dépendances
    await queryInterface.dropTable('posts');
    await queryInterface.dropTable('users');
  }
};
```

---

## Seeders Complets

### Seeder avancé avec dépendances

```typescript
// src/seeders/XXXXXX-initial-data.ts
import { QueryInterface } from 'sequelize';
import { hashPassword } from '../utils/auth';

export = {
  up: async (queryInterface: QueryInterface) => {
    // 1. Création des rôles
    const roles = await queryInterface.bulkInsert('roles', [
      { name: 'admin', createdAt: new Date(), updatedAt: new Date() },
      { name: 'user', createdAt: new Date(), updatedAt: new Date() }
    ], { returning: true });

    // 2. Création utilisateur admin
    const [admin] = await queryInterface.bulkInsert('users', [
      {
        email: 'admin@example.com',
        password: await hashPassword('SecurePassword123!'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { returning: true });

    // 3. Association des rôles
    await queryInterface.bulkInsert('user_roles', [
      {
        userId: admin.id,
        roleId: roles.find(r => r.name === 'admin').id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // 4. Données de test
    if (process.env.NODE_ENV === 'development') {
      await queryInterface.bulkInsert('users', [
        {
          email: 'test@example.com',
          password: await hashPassword('TestPassword123!'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    // Ordre inverse des dépendances
    await queryInterface.bulkDelete('user_roles', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};
```

### Seeder avec données réalistes (using faker)

```typescript
// src/seeders/XXXXXX-dev-test-data.ts
import { QueryInterface } from 'sequelize';
import { faker } from '@faker-js/faker';
import { hashPassword } from '../utils/auth';

export = {
  up: async (queryInterface: QueryInterface) => {
    if (process.env.NODE_ENV !== 'development') return;

    // Génération de 50 utilisateurs fictifs
    const users = Array.from({ length: 50 }).map(() => ({
      email: faker.internet.email(),
      password: hashPassword(faker.internet.password()),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await queryInterface.bulkInsert('users', users);

    // Pour chaque utilisateur, créer 1-5 posts
    const userIds = await queryInterface.sequelize.query(
      'SELECT id FROM users ORDER BY created_at DESC LIMIT 50',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const posts = [];
    for (const user of userIds) {
      const postCount = faker.datatype.number({ min: 1, max: 5 });
      for (let i = 0; i < postCount; i++) {
        posts.push({
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraphs(3),
          authorId: user.id,
          createdAt: faker.date.recent(30),
          updatedAt: new Date()
        });
      }
    }

    await queryInterface.bulkInsert('posts', posts);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('posts', null, {});
    await queryInterface.bulkDelete('users', {
      email: { [Op.like]: '%@example.faker%' }
    }, {});
  }
};
```

---

## Cas d'Usage Spécifiques

### 1. Soft Delete (Suppression logique)

**Migration:**
```typescript
await queryInterface.addColumn('users', 'deleted_at', {
  type: DataTypes.DATE,
  allowNull: true
});
```

**Model:**
```typescript
{
  paranoid: true, // Active le soft delete
  // ...
}
```

**Utilisation:**
```typescript
// Suppression
await user.destroy(); // Ne supprime pas réellement

// Restauration
await user.restore();

// Recherche (n'inclut pas les supprimés par défaut)
const users = await User.findAll();

// Inclure les supprimés
const allUsers = await User.findAll({ paranoid: false });
```

### 2. Données Sensibles (Chiffrement)

**Migration:**
```typescript
await queryInterface.addColumn('users', 'api_key_encrypted', {
  type: DataTypes.STRING(512),
  allowNull: true
});
```

**Model:**
```typescript
{
  apiKeyEncrypted: {
    type: DataTypes.STRING(512),
    allowNull: true,
    set(value: string) {
      if (value) {
        this.setDataValue('apiKeyEncrypted', encrypt(value));
      }
    },
    get() {
      const encrypted = this.getDataValue('apiKeyEncrypted');
      return encrypted ? decrypt(encrypted) : null;
    }
  }
}
```

### 3. Polymorphisme

**Migration:**
```typescript
await queryInterface.createTable('comments', {
  id: DataTypes.INTEGER,
  commentableId: DataTypes.INTEGER,
  commentableType: DataTypes.STRING, // 'post' ou 'video'
  // ...
});
```

**Model:**
```typescript
Comment.associate = () => {
  Comment.belongsTo(models.Post, {
    foreignKey: 'commentableId',
    constraints: false,
    scope: {
      commentableType: 'post'
    }
  });
  
  Comment.belongsTo(models.Video, {
    foreignKey: 'commentableId',
    constraints: false,
    scope: {
      commentableType: 'video'
    }
  });
};
```

---

## Bonnes Pratiques

1. **Versionnement**:
   - Toujours versionner les fichiers de migration/seeder
   - Ne jamais modifier une migration déjà en production

2. **Sécurité**:
   - Ne pas mettre de données sensibles dans les seeders
   - Utiliser des variables d'environnement pour les configurations

3. **Performance**:
   - Pour les gros volumes de données, utiliser `bulkInsert` avec transactions
   - Créer des index sur les colonnes fréquemment interrogées

4. **Organisation**:
   - Un dossier par domaine/fonctionnalité
   - Nommage clair des migrations/seeders (ex: `add-feature-x-to-table-y`)

5. **Documentation**:
   - Commenter les migrations complexes
   - Documenter les relations entre models

---

## Dépannage

### Problème: Migration échouée

**Solution:**
```bash
# Annuler la dernière migration
npm run migrate:undo

# Corriger le fichier de migration
# Puis ré-exécuter
npm run migrate
```

### Problème: Incohérence modèle/BDD

**Solution:**
1. Vérifier l'historique des migrations (`sequelize db:migrate:status`)
2. Synchroniser manuellement si nécessaire

### Problème: Seeders ne s'exécutent pas

**Vérifier:**
1. L'ordre d'exécution (nommage des fichiers)
2. Que `NODE_ENV` est correctement défini
3. Les dépendances entre seeders

Ce guide couvre l'ensemble des cas d'usage courants avec Sequelize en TypeScript. Pour des besoins spécifiques, adapter les exemples à votre contexte.