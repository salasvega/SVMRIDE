# 🚀 Démarrage Rapide - Interface Admin

## ⚡ En 3 minutes : Du compte à votre premier véhicule

---

## ✅ Étape 1 : Créer votre compte admin (une seule fois)

**Durée : 2 minutes**

1. 🌐 Ouvrez https://supabase.com
2. 🔑 Connectez-vous à votre compte
3. 📂 Sélectionnez le projet **SVM Ride**
4. 🔐 Cliquez sur **Authentication** (menu de gauche)
5. ➕ Cliquez sur **"Add user"** → **"Create new user"**
6. ✍️ Remplissez :
   ```
   Email: admin@svmride.com
   Mot de passe: [choisissez un mot de passe sécurisé]
   ☑️ Auto Confirm User (coché)
   ```
7. ✅ Cliquez sur **"Create user"**

---

## 🔓 Étape 2 : Se connecter à l'admin

**Durée : 30 secondes**

### Option A : Via le footer du site
1. 🏠 Allez sur votre site (http://localhost:5173)
2. ⬇️ Descendez tout en bas de la page
3. 👆 Cliquez sur **"Administration"** (petit lien gris en bas à droite)

### Option B : URL directe
1. 🌐 Tapez dans le navigateur : `http://localhost:5173/admin/login`
2. ⏎ Appuyez sur Entrée

### Connexion
1. ✍️ Entrez votre email : `admin@svmride.com`
2. 🔒 Entrez votre mot de passe
3. 👆 Cliquez sur **"Se connecter"**

🎉 **Vous êtes dans l'admin !**

---

## 📝 Étape 3 : Ajouter votre premier véhicule

**Durée : 2-3 minutes**

### Vue d'ensemble
Vous voyez maintenant le **Dashboard** avec :
- 📊 Statistiques (nombre de véhicules)
- 🚀 Bouton **"Ajouter un véhicule"** (en haut à droite)

### Créer la fiche véhicule

1. 👆 Cliquez sur **"Ajouter un véhicule"**

2. 📋 **Remplissez le formulaire** :

   **Informations de base :**
   ```
   Marque: Yamaha
   Modèle: MT-07
   Type: Moto
   Année: 2020
   ```

   **Spécifications :**
   ```
   Cylindrée: 689 cc
   Prix: 6490 €
   Kilométrage: 12500 km
   État: Bon
   ```

   **Description** (optionnel) :
   ```
   Belle Yamaha MT-07 en bon état général,
   entretien régulier, pneus neufs. Prête à rouler !
   ```

   **Équipements** (optionnel) :
   ```
   ABS, LED, Freinage combiné, Tableau de bord digital
   ```
   *(Séparez par des virgules)*

3. 📸 **Ajoutez des photos** :
   - Descendez jusqu'à la section "Photos"
   - Cliquez sur **"Ajouter des photos"**
   - Sélectionnez 3 à 6 images depuis votre ordinateur
   - Attendez que l'upload se termine (barre de progression)

4. ☑️ **Cochez "Visible sur le site"**

5. 💾 **Cliquez sur "Enregistrer"** (en bas)

---

## 🎉 C'est fait !

✅ Votre véhicule est maintenant en ligne !

**Vérifier :**
1. 🏠 Cliquez sur l'icône maison en haut à droite
2. 🚗 Allez dans "Véhicules"
3. 👀 Votre moto apparaît dans le catalogue !

---

## 🔄 Actions rapides courantes

### ✏️ Modifier un véhicule
1. Admin → **Véhicules**
2. Cliquez sur ✏️ à côté du véhicule
3. Modifiez ce que vous voulez
4. **Enregistrer**

### 👁️ Masquer un véhicule (vendu)
1. Admin → **Véhicules**
2. Cliquez sur le badge **"Visible"**
3. Il devient **"Caché"** automatiquement

### 🗑️ Supprimer un véhicule
1. Admin → **Véhicules**
2. Cliquez sur 🗑️ à côté du véhicule
3. Confirmez

### 📸 Ajouter des photos à un véhicule existant
1. Admin → **Véhicules**
2. Cliquez sur ✏️
3. Descendez à "Photos"
4. Cliquez **"Ajouter des photos"**
5. Sélectionnez les nouvelles images
6. **Enregistrer**

---

## 💡 Astuces pro

### ⚡ Slug automatique
Après avoir tapé la marque, le modèle et l'année, le **slug** (URL) se génère automatiquement !
```
Yamaha MT-07 2020 → yamaha-mt-07-2020
```

### 📸 Photos
- **Formats** : JPG, PNG, WebP
- **Taille max** : 5 MB par image
- **Nombre recommandé** : 3 à 6 photos
- **Ordre** : La première photo sera la photo principale

### 💾 Sauvegarde automatique
Chaque modification est **instantanément visible** sur le site public (si "Visible sur le site" est coché).

### 🔒 Déconnexion
N'oubliez pas de vous déconnecter après chaque session (bouton en haut à droite).

---

## 📚 Pour aller plus loin

### Guides complets disponibles :

1. **[ACCES_ADMIN.md](./ACCES_ADMIN.md)**
   - Toutes les méthodes d'accès
   - Résolution de problèmes de connexion

2. **[GUIDE_INTERFACE_ADMIN.md](./GUIDE_INTERFACE_ADMIN.md)**
   - Guide complet (19 pages)
   - Tous les cas d'usage
   - Bonnes pratiques
   - FAQ détaillée

3. **[GUIDE_ADMIN.md](./GUIDE_ADMIN.md)**
   - Gestion directe via Supabase (avancé)
   - Requêtes SQL
   - Migration de données

---

## 🆘 Besoin d'aide ?

### ❓ Je ne trouve pas le lien "Administration"
→ Descendez **tout en bas** de n'importe quelle page, il est en bas à droite du footer (en petit, gris).

### 🔒 "Email ou mot de passe incorrect"
→ Vérifiez que vous avez bien créé le compte dans **Supabase Auth** (Étape 1).

### 📸 Les photos ne s'uploadent pas
→ Vérifiez :
- Taille < 5 MB
- Format JPG, PNG ou WebP
- Connexion internet stable

### 🌐 Le véhicule n'apparaît pas sur le site
→ Vérifiez que **"Visible sur le site"** est coché ☑️

---

**🎓 Vous êtes maintenant prêt à gérer votre catalogue comme un pro !**
