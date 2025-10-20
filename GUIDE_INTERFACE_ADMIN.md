# Guide de l'Interface d'Administration - SVM Ride

## 🎯 Vue d'ensemble

Votre site dispose maintenant d'une interface d'administration complète et intuitive qui vous permet de gérer facilement votre catalogue de véhicules sans avoir besoin d'accéder à la base de données directement.

---

## 🔐 Première connexion

### Créer votre compte administrateur

**Important :** Avant de pouvoir vous connecter, vous devez créer votre compte via Supabase :

1. Rendez-vous sur https://supabase.com
2. Connectez-vous à votre compte
3. Sélectionnez votre projet SVM Ride
4. Dans le menu de gauche, cliquez sur **"Authentication"**
5. Cliquez sur **"Add user"** → **"Create new user"**
6. Remplissez :
   - **Email** : votre adresse email admin (ex: `admin@svmride.com`)
   - **Password** : choisissez un mot de passe sécurisé
7. Décochez **"Auto Confirm User"** si nécessaire
8. Cliquez sur **"Create user"**

### Se connecter à l'interface admin

1. Allez sur votre site à l'adresse : **`/admin/login`**
   - Exemple : `https://votre-site.com/admin/login`
2. Entrez votre email et mot de passe
3. Cliquez sur **"Se connecter"**

✅ Vous êtes maintenant connecté à l'interface d'administration !

---

## 📊 Dashboard (Tableau de bord)

Après connexion, vous arrivez sur le **Dashboard** qui affiche :

- **Total véhicules** : Nombre total de véhicules dans la base
- **Disponibles** : Véhicules visibles sur le site public
- **Motos** : Nombre de motos
- **Scooters** : Nombre de scooters

**Actions rapides :**
- Cliquer sur "Gérer les véhicules" pour voir la liste complète
- Cliquer sur "Ajouter un véhicule" pour créer une nouvelle fiche

---

## 📝 Ajouter un nouveau véhicule

### Méthode 1 : Depuis le Dashboard
1. Cliquez sur le bouton **"Ajouter un véhicule"** (en haut à droite)

### Méthode 2 : Depuis la liste des véhicules
1. Allez dans **"Véhicules"** (menu du haut)
2. Cliquez sur **"Ajouter un véhicule"**

### Remplir le formulaire

#### **Section : Informations générales**

1. **Marque** (obligatoire)
   - Exemple : `Yamaha`, `Honda`, `Kawasaki`

2. **Modèle** (obligatoire)
   - Exemple : `MT-07`, `CB 500 X`, `Z650`

3. **Type** (obligatoire)
   - Choisissez : `Moto` ou `Scooter`

4. **Année** (obligatoire)
   - Année de mise en circulation
   - Exemple : `2020`, `2023`

5. **Cylindrée (cc)** (obligatoire)
   - En centimètres cubes
   - Exemple : `689`, `125`, `500`

6. **Prix (€)** (obligatoire)
   - Prix de vente en euros
   - Exemple : `6490`, `8990`
   - N'incluez PAS le symbole €

7. **Kilométrage** (obligatoire)
   - Kilométrage actuel
   - Exemple : `12500`, `5000`

8. **État** (obligatoire)
   - Choisissez parmi :
     - `Excellent` : comme neuf
     - `Bon` : bien entretenu
     - `Correct` : quelques traces d'usage
     - `À réviser` : nécessite entretien

9. **Slug (URL)** (obligatoire)
   - ✨ **Généré automatiquement** après avoir saisi marque, modèle et année
   - Format : `yamaha-mt-07-2020`
   - Peut être modifié manuellement si besoin

10. **Description** (optionnel)
    - Décrivez l'état général, les points forts, l'entretien effectué
    - Exemple : *"Yamaha MT-07 en excellent état, entretien complet réalisé, pneus neufs..."*

11. **Garantie** (optionnel)
    - Texte de la garantie
    - Par défaut : `Garantie 6 mois pièces et main d'œuvre`

12. **Équipements** (optionnel)
    - Listez les équipements séparés par des virgules
    - Exemple : `ABS, LED, Quickshifter, TFT, Contrôle de traction`

13. **Visible sur le site** (case à cocher)
    - ✅ Coché : le véhicule apparaît sur le site public
    - ❌ Décoché : le véhicule est caché (brouillon ou vendu)

#### **Section : Photos**

**Upload de photos :**

1. Cliquez sur la zone **"Ajouter des photos"**
2. Sélectionnez une ou plusieurs images depuis votre ordinateur
3. Les photos sont automatiquement uploadées et hébergées sur Supabase
4. Formats acceptés : JPG, PNG, WebP
5. Taille max : 5 MB par image

**Gestion des photos :**
- Survolez une photo avec la souris
- Cliquez sur le bouton ❌ rouge pour la supprimer
- L'ordre des photos est celui d'affichage sur le site

**Bonnes pratiques :**
- 3 à 6 photos par véhicule
- Photos nettes et bien éclairées
- Montrez : face, profil, tableau de bord, détails

### Enregistrer

- Cliquez sur **"Enregistrer"** en bas du formulaire
- ✅ Le véhicule est créé et apparaît immédiatement sur le site (si "Visible" est coché)

---

## ✏️ Modifier un véhicule existant

### Depuis la liste des véhicules

1. Allez dans **"Véhicules"** (menu du haut)
2. Trouvez le véhicule à modifier dans la liste
3. Cliquez sur l'icône **crayon** (✏️) dans la colonne "Actions"
4. Modifiez les champs souhaités
5. Ajoutez ou supprimez des photos
6. Cliquez sur **"Enregistrer"**

### Modifications courantes

**Changer le prix :**
1. Éditez le véhicule
2. Modifiez le champ "Prix"
3. Enregistrez

**Mettre à jour le kilométrage :**
1. Éditez le véhicule
2. Modifiez le champ "Kilométrage"
3. Enregistrez

**Ajouter/modifier des photos :**
1. Éditez le véhicule
2. Descendez jusqu'à la section "Photos"
3. Ajoutez de nouvelles photos ou supprimez les anciennes
4. Enregistrez

---

## 👁️ Masquer/Afficher un véhicule

### Masquer rapidement (véhicule vendu)

**Depuis la liste :**
1. Trouvez le véhicule dans la liste
2. Cliquez sur le badge **"Visible"** dans la colonne "Statut"
3. Il devient automatiquement **"Caché"** ❌
4. Le véhicule disparaît du site public mais reste dans la base

**Réafficher :**
- Cliquez à nouveau sur le badge **"Caché"**
- Il redevient **"Visible"** ✅

---

## 🗑️ Supprimer un véhicule

**⚠️ Attention : La suppression est définitive !**

1. Allez dans **"Véhicules"**
2. Trouvez le véhicule à supprimer
3. Cliquez sur l'icône **poubelle** (🗑️) dans la colonne "Actions"
4. Confirmez la suppression dans la fenêtre popup

**Alternative recommandée :**
- Au lieu de supprimer, masquez le véhicule (voir section précédente)
- Vous conservez l'historique et pouvez le réafficher plus tard

---

## 🔍 Fonctionnalités de la liste

### Colonnes affichées

- **Véhicule** : Marque, modèle et cylindrée
- **Type** : Moto ou Scooter
- **Prix** : Prix affiché avec formatage
- **Année** : Année du véhicule
- **Statut** : Visible (✅) ou Caché (❌)
- **Actions** : Modifier (✏️) ou Supprimer (🗑️)

### Navigation

- **Menu du haut** :
  - Dashboard : retour au tableau de bord
  - Véhicules : liste des véhicules
  - Icône maison : voir le site public
  - Déconnexion : se déconnecter

---

## 💡 Astuces et bonnes pratiques

### Photos

✅ **À faire :**
- Prendre des photos en plein jour
- Nettoyer le véhicule avant les photos
- Photographier sous plusieurs angles
- Montrer les détails importants

❌ **À éviter :**
- Photos floues ou sombres
- Arrière-plans encombrés
- Photos trop lourdes (> 5 MB)

### Descriptions

✅ **À faire :**
- Être honnête sur l'état
- Mentionner l'entretien effectué
- Mettre en avant les points forts
- 50 à 200 mots

❌ **À éviter :**
- Descriptions génériques
- Fautes d'orthographe
- Textes trop longs

### Organisation

✅ **À faire :**
- Masquer les véhicules vendus plutôt que les supprimer
- Mettre à jour régulièrement les prix et kilométrages
- Vérifier que les photos sont de bonne qualité
- Utiliser des descriptions cohérentes

---

## 🆘 Problèmes courants

### Je n'arrive pas à me connecter
- Vérifiez que vous avez bien créé votre compte dans Supabase Auth
- Vérifiez votre email et mot de passe
- Essayez de réinitialiser votre mot de passe via Supabase

### Les photos ne s'uploadent pas
- Vérifiez la taille du fichier (< 5 MB)
- Vérifiez le format (JPG, PNG, WebP uniquement)
- Essayez avec une seule photo d'abord
- Vérifiez votre connexion internet

### Le véhicule n'apparaît pas sur le site
- Vérifiez que la case "Visible sur le site" est cochée
- Vérifiez que tous les champs obligatoires sont remplis
- Rafraîchissez la page du site (Ctrl + F5)

### Une photo ne s'affiche pas
- Vérifiez que l'upload s'est bien terminé
- Supprimez la photo et réuploadez-la
- Essayez avec un format différent (JPG au lieu de PNG)

---

## 📱 Responsive & Mobile

L'interface d'administration est **responsive** et fonctionne sur :
- 💻 Desktop
- 📱 Tablette
- 📱 Mobile

Vous pouvez gérer votre catalogue depuis n'importe quel appareil !

---

## 🔒 Sécurité

- Seuls les utilisateurs authentifiés peuvent accéder à l'admin
- Les photos sont stockées de manière sécurisée sur Supabase Storage
- Les modifications sont instantanées et sécurisées
- Déconnectez-vous après chaque session

---

## 🎓 Résumé du workflow

**Pour ajouter un véhicule :**
1. Connexion → Dashboard → "Ajouter un véhicule"
2. Remplir le formulaire (marque, modèle, année, etc.)
3. Uploader 3-6 photos
4. Cocher "Visible sur le site"
5. Enregistrer

**Pour modifier un véhicule :**
1. Connexion → Véhicules
2. Clic sur ✏️ à côté du véhicule
3. Modifier les champs
4. Enregistrer

**Pour marquer comme vendu :**
1. Connexion → Véhicules
2. Clic sur "Visible" dans la colonne Statut
3. C'est tout ! ✅

---

**Besoin d'aide ?** Consultez ce guide ou contactez votre développeur pour un accompagnement personnalisé.

**Dernière mise à jour** : 2025
