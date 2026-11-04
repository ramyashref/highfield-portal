HIGHFIELD EGYPT LEARNING PORTAL — CSS / LAYOUT FIX

This is a limited patch for the unstyled login page shown in the screenshot.

Replace ONLY these four files in the ROOT of the existing GitHub Pages repository:
- trainee-login.html
- trainee-dashboard.html
- portal.css
- portal.js

Important:
- Keep all four files at the repository root, at the same level as index.html.
- Do not put them inside a new folder.
- portal.css must be at the same level as trainee-login.html and trainee-dashboard.html.
- The HTML uses a cache-busting query string for portal.css so browsers fetch the latest stylesheet.
- The signup form also has a native hidden attribute, and portal.js now toggles it, so the login and signup forms will not appear together if CSS fails.

No Firebase configuration, Firestore rules, program catalog, or other website pages are changed by this patch.

After upload:
1. Commit the four files.
2. Wait for GitHub Pages deployment.
3. Open https://highfieldeg.com/trainee-login.html in a private/incognito window or hard-refresh with Ctrl+F5.
4. Check that the login card is centered and only the login form is visible until "إنشاء حساب جديد" is clicked.
