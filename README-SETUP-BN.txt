MIYAD Electronics Shop — Firebase Admin setup

Included files:
- firebase-config.js: Firebase web configuration supplied by the owner
- storefront-data.js: live Firestore product listener
- admin.html / admin.js: admin login and product management
- firestore.rules: public product read, admin-only product writes

IMPORTANT:
1. Before publishing, confirm the admin UID in firestore.rules is the UID of the intended admin account in Firebase Authentication. It currently uses the UID supplied in the conversation.
2. In Firebase Console > Authentication > Sign-in method, enable Email/Password and create the admin user.
3. In Firestore > Rules, publish the contents of firestore.rules.
4. Upload the files in this ZIP to the root of the GitHub repository, replacing index.html, products.js and script.js with the versions from this ZIP.
5. Open https://YOUR-GITHUB-PAGES-DOMAIN/admin.html to log in.
6. After login, press “পুরোনো ৮টি পণ্য Firestore-এ যোগ করুন” once. This seeds the existing catalogue with stock 0.

Security:
- Never place an admin password or service-account private key in website files.
- The Firebase web apiKey is a project identifier, not an admin password.
- This starter panel manages product data only. It does not manage orders or upload image files; use a publicly accessible image URL.
