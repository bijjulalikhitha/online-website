# Brightpath learning dashboard

Brightpath is a React + Vite learning dashboard with course lessons, notes, quizzes, and live course progress stored in Firebase Realtime Database. Students sign in with Google to take the programming quiz and see their saved results on their next visit.

## Run locally

1. Install Node.js and install dependencies. In PowerShell, run `npm.cmd install` (or use `npm install` in Command Prompt).
2. Copy `.env.example` to `.env.local` and add your Firebase web app configuration.
3. In Firebase Console, enable **Authentication → Sign-in method → Google**. Choose a support email and save the provider.
4. In **Authentication → Settings → Authorized domains**, add your deployed website domain. Localhost is normally included for local testing.
5. Create a **Realtime Database**. Its access rules are kept in [`database.rules.json`](./database.rules.json); copy that file's contents into **Realtime Database → Rules** and publish. `firebase.json` connects the rules file to Firebase CLI deployments.
6. In PowerShell, run `npm.cmd run dev` (or `npm run dev` in Command Prompt), then open the local URL printed by Vite.

Using `npm.cmd` in PowerShell avoids the blocked `npm.ps1` script without changing your PowerShell execution policy.

Vite reads `.env.local` at startup. Restart the dev server after changing Firebase configuration. Do not commit `.env.local`.

## Deploy to GitHub Pages

GitHub Pages serves the `docs/` folder from the `main` branch. The Vite configuration builds directly into that folder and uses `/online-website/` as the site base path.

1. Make sure `.env.local` contains the Firebase web app configuration.
2. Run `npm.cmd run build` to update the published site in `docs/`.
3. Commit and push the source and generated `docs/` changes to `main`. GitHub Pages will publish the update at <https://bijjulalikhitha.github.io/online-website/>.
4. In Firebase Authentication, add `bijjulalikhitha.github.io` to the authorized domains.

## Deploy database rules with Firebase CLI

After installing and logging in to Firebase CLI, select your project and run `firebase deploy --only database`. The CLI reads the rules path configured in `firebase.json`.

Students sign in or create an account with Google. The app subscribes to each signed-in student's `users/{uid}` data. Course progress, saved notes, quick notes, and quiz results are isolated by their Firebase Authentication UID and sync in real time. If the Google provider is not enabled or the current domain is not authorized, the login screen displays a setup error.
