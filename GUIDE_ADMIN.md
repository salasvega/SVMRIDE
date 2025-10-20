# Guide d'Administration - SVM Ride

## Comment gérer le catalogue de véhicules

Votre site utilise maintenant **Supabase** pour stocker tous les véhicules. Vous pouvez gérer facilement le contenu (descriptions, photos, prix, etc.) de deux façons :

---

## Méthode 1 : Interface Web Supabase (Recommandé)

### Accéder à la base de données

1. Rendez-vous sur : https://supabase.com
2. Connectez-vous avec votre compte
3. Sélectionnez votre projet SVM Ride
4. Dans le menu de gauche, cliquez sur **"Table Editor"**
5. Sélectionnez la table **`vehicles`**

### Ajouter un nouveau véhicule

1. Cliquez sur le bouton **"Insert row"** (ou **"+"**)
2. Remplissez les champs :

   **Champs obligatoires :**
   - `slug` : identifiant URL unique (ex: `yamaha-mt-09-2023`)
   - `brand` : Marque (ex: `Yamaha`)
   - `model` : Modèle (ex: `MT-09`)
   - `year` : Année (ex: `2023`)
   - `type` : Type (`moto` ou `scooter`)
   - `displacement` : Cylindrée en cc (ex: `890`)
   - `price` : Prix en euros (ex: `8990`)
   - `mileage` : Kilométrage (ex: `5000`)
   - `condition` : État (`excellent`, `bon`, `correct`, ou `a-reviser`)

   **Champs optionnels :**
   - `description` : Description détaillée du véhicule
   - `images` : Liste d'URLs des photos (format JSON: `["url1.jpg", "url2.jpg"]`)
   - `features` : Liste des équipements (format JSON: `["ABS", "LED", "Bluetooth"]`)
   - `warranty` : Texte de la garantie (ex: `Garantie 12 mois`)
   - `available` : Cochez pour rendre visible sur le site

3. Cliquez sur **"Save"**

### Modifier un véhicule existant

1. Dans la table **`vehicles`**, trouvez le véhicule à modifier
2. Cliquez sur la ligne pour l'éditer
3. Modifiez les champs souhaités (prix, kilométrage, description, etc.)
4. Cliquez sur **"Save"**

### Supprimer un véhicule

**Option 1 : Rendre invisible (recommandé)**
- Décochez la case `available` - le véhicule disparaîtra du site mais restera dans la base

**Option 2 : Supprimer définitivement**
- Cliquez sur les 3 points à droite de la ligne
- Sélectionnez **"Delete row"**
- Confirmez la suppression

### Gérer les photos

Les URLs des photos sont stockées en JSON. Exemples :

```json
[
  "https://votre-cdn.com/photos/moto1.jpg",
  "https://votre-cdn.com/photos/moto2.jpg",
  "https://votre-cdn.com/photos/moto3.jpg"
]
```

**Où héberger vos photos :**
1. **Supabase Storage** (recommandé) :
   - Dans Supabase, allez dans **"Storage"**
   - Créez un bucket public `vehicle-images`
   - Uploadez vos photos
   - Copiez les URLs générées

2. **Service externe** :
   - Imgur, Cloudinary, ou votre propre serveur
   - Copiez l'URL directe de l'image

---

## Méthode 2 : API SQL (Avancé)

Si vous êtes à l'aise avec SQL, vous pouvez utiliser l'éditeur SQL dans Supabase.

### Ajouter un véhicule via SQL

```sql
INSERT INTO vehicles (
  slug, brand, model, year, type, displacement,
  price, mileage, condition, description,
  images, features, warranty, available
)
VALUES (
  'kawasaki-ninja-650-2023',
  'Kawasaki',
  'Ninja 650',
  2023,
  'moto',
  649,
  7990,
  3500,
  'excellent',
  'Kawasaki Ninja 650 en parfait état, très peu roulée.',
  '["https://exemple.com/ninja1.jpg", "https://exemple.com/ninja2.jpg"]',
  '["ABS", "Contrôle de traction", "LED", "TFT"]',
  'Garantie 12 mois pièces et main d''œuvre',
  true
);
```

### Modifier le prix d'un véhicule

```sql
UPDATE vehicles
SET price = 7490
WHERE slug = 'kawasaki-ninja-650-2023';
```

### Mettre à jour plusieurs champs

```sql
UPDATE vehicles
SET
  mileage = 4500,
  price = 7790,
  description = 'Kawasaki Ninja 650 en excellent état avec révision complète.'
WHERE slug = 'kawasaki-ninja-650-2023';
```

### Marquer un véhicule comme vendu (invisible)

```sql
UPDATE vehicles
SET available = false
WHERE slug = 'kawasaki-ninja-650-2023';
```

### Voir tous les véhicules disponibles

```sql
SELECT brand, model, year, price, available
FROM vehicles
ORDER BY created_at DESC;
```

---

## Bonnes pratiques

### 1. Photos
- **Format** : JPG ou WebP
- **Taille** : Max 1920x1080 px (optimisées pour le web)
- **Poids** : Moins de 500 KB par photo
- **Nombre** : 3 à 6 photos par véhicule
- Montrez : face, profil, tableau de bord, moteur, détails

### 2. Slug (URL)
- Unique pour chaque véhicule
- Minuscules, sans accents
- Séparez avec des tirets `-`
- Format : `marque-modele-annee` (ex: `yamaha-r1-2022`)

### 3. Description
- 50 à 200 mots
- Mentionnez l'état général, l'entretien, les points forts
- Soyez honnête et précis

### 4. Prix
- Prix en euros, sans décimales
- Exemple : `8990` pour 8 990 €

### 5. Caractéristiques (features)
- Listez les équipements importants
- ABS, contrôle de traction, éclairage LED, etc.

---

## Dépannage

### Le véhicule n'apparaît pas sur le site
- Vérifiez que `available` est coché (true)
- Vérifiez que tous les champs obligatoires sont remplis
- Actualisez la page du site (Ctrl + F5)

### Les photos ne s'affichent pas
- Vérifiez que les URLs sont correctes et accessibles
- Testez les URLs dans votre navigateur
- Assurez-vous que le format JSON est valide : `["url1.jpg", "url2.jpg"]`

### Erreur "invalid input syntax for type uuid"
- N'essayez pas de définir l'`id` manuellement
- Laissez Supabase le générer automatiquement

---

## Besoin d'aide ?

- **Documentation Supabase** : https://supabase.com/docs
- **Support technique** : Contactez votre développeur
- **Tutoriel vidéo** : Demandez une démo personnalisée

---

**Dernière mise à jour** : 2025
