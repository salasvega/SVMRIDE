# 🔑 Comment accéder à l'interface d'administration

## Méthode 1 : Via le lien dans le footer (NOUVEAU ✨)

1. Descendez tout en bas de n'importe quelle page du site
2. Dans le footer, cherchez le lien **"Administration"** en bas à droite (en gris discret)
3. Cliquez dessus
4. Vous arrivez sur la page de connexion admin

## Méthode 2 : URL directe

Tapez directement dans votre navigateur :

**En développement local :**
```
http://localhost:5173/admin/login
```

**En production :**
```
https://votre-site.com/admin/login
```

---

## 🚀 Première connexion

### IMPORTANT : Créez d'abord votre compte administrateur

Avant de pouvoir vous connecter, vous devez créer un compte via Supabase :

1. Allez sur https://supabase.com
2. Connectez-vous à votre compte
3. Sélectionnez votre projet **SVM Ride**
4. Dans le menu de gauche, cliquez sur **"Authentication"** (icône de cadenas)
5. Cliquez sur le bouton **"Add user"** puis **"Create new user"**
6. Remplissez le formulaire :
   - **Email** : `admin@svmride.com` (ou votre email)
   - **Password** : choisissez un mot de passe sécurisé (min. 6 caractères)
   - Laissez **"Auto Confirm User"** coché
7. Cliquez sur **"Create user"**

✅ Votre compte admin est créé !

### Se connecter

1. Retournez sur votre site
2. Allez sur `/admin/login` (via le footer ou URL directe)
3. Entrez :
   - **Email** : celui que vous avez créé
   - **Mot de passe** : celui que vous avez choisi
4. Cliquez sur **"Se connecter"**

🎉 Vous êtes maintenant dans l'interface d'administration !

---

## 📍 Navigation dans l'admin

Une fois connecté, vous verrez une barre de navigation en haut avec :

- **Dashboard** : Tableau de bord avec statistiques
- **Véhicules** : Liste de tous les véhicules
- **Icône maison** 🏠 : Retour au site public
- **Déconnexion** : Se déconnecter

---

## 💡 Conseils

### Marque-page (Bookmark)
Ajoutez `/admin/login` à vos favoris pour un accès rapide !

### Le lien est discret
Le lien "Administration" dans le footer est volontairement discret (petit et gris) pour ne pas être visible par les visiteurs.

### Sécurité
- Ne partagez jamais vos identifiants admin
- Utilisez un mot de passe fort
- Déconnectez-vous après chaque session

---

## 🆘 Problèmes d'accès ?

### "Email ou mot de passe incorrect"
- Vérifiez que vous avez bien créé le compte dans Supabase Auth
- Vérifiez l'orthographe de votre email
- Le mot de passe est sensible à la casse

### "La page ne charge pas"
- Vérifiez que le serveur de développement est lancé (`npm run dev`)
- Vérifiez l'URL (doit contenir `/admin/login`)
- Actualisez la page (F5)

### "Je ne vois pas le lien dans le footer"
- Descendez complètement en bas de la page
- Le lien est en bas à droite, écrit "Administration" en petit

---

## 📖 Prochaines étapes

Une fois connecté, consultez le **[Guide d'utilisation complet](./GUIDE_INTERFACE_ADMIN.md)** pour :
- Ajouter votre premier véhicule
- Uploader des photos
- Gérer le catalogue
- Astuces et bonnes pratiques
