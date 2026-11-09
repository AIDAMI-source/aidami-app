# Aid'Ami — build preview EAS (tests associations, sans tunnel)

Distribuer une APK Android (et éventuellement iOS) installable **sans laisser Metro / le tunnel Expo ouverts**.

## Prérequis (compte Expo)

1. Compte sur [expo.dev](https://expo.dev) (gratuit OK pour démarrer).
2. Une seule fois sur la machine de build :

```bash
npm i -g eas-cli
eas login
cd aidami-app
eas build:configure   # lie le projet Expo ; ajoute extra.eas.projectId dans app.json — committer ce changement
```

Ne pas committer de secrets (tokens, keystores locaux, `.env`).

## Android (recommandé pour les associations)

```bash
eas build --profile preview --platform android
# ou : npm run build:preview:android
```

- Profil `preview` → distribution **internal** + **APK** (installable hors Play Store).
- À la fin : ouvrir le lien de build Expo → bouton **Install** / télécharger l’APK.
- Envoyer ce lien (ou le fichier `.apk`) aux testeurs.
- Sur le téléphone : autoriser l’installation depuis une source inconnue si demandé, puis ouvrir l’app **Aid'Ami**.

Aucun PC / tunnel n’est requis après le build.

## iOS (compte Apple requis)

```bash
eas build --profile preview --platform ios
# ou : npm run build:preview:ios
```

- Compte **Apple Developer** (payant) nécessaire pour ad-hoc / TestFlight.
- Ad-hoc : enregistrer chaque appareil (`eas device:create`) puis rebuild.
- Alternative : build **production** + `eas submit` → TestFlight.

Sans compte Apple, rester sur Android APK pour les associations.

## Profils (`eas.json`)

| Profil | Usage |
|--------|--------|
| `preview` | Tests internes (APK Android / ad-hoc iOS) |
| `development` | Dev client (nécessite `expo-dev-client`) |
| `production` | Stores (AAB Android) |

Identifiants natifs : `com.aidami.app` (`android.package` / `ios.bundleIdentifier`).
