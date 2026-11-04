Highfield Egypt Learning Portal — My Learning + Financial Split + Payment Upload Fix

Included files:
- trainee-dashboard.html
- admin-dashboard.html
- portal.js
- portal.css
- firestore.rules
- storage.rules

What this update does:
1. My Learning now displays active annual and individual programEnrollments, not only trainingProgress documents.
2. Financial summary separates annual-program fees/paid/balance from individual-program fees/paid/balance.
3. Keeps Cancellation Management in the admin dashboard, including approve/reject actions and admin decision notes.
4. Payment submission now displays upload and save stages, disables the button while processing, and shows specific Firebase Storage/Firestore errors.
5. Includes Storage Rules for payment proof uploads. This is likely required because publishing Firestore Rules alone does not authorize Firebase Storage uploads.

Deployment:
A. Back up current files and current Firebase rules.
B. Replace the matching site files in the repository root with the files in this ZIP.
C. Firebase Console > Build > Firestore Database > Rules: publish firestore.rules.
D. Firebase Console > Build > Storage > Rules: publish storage.rules.
E. Ensure Firebase Storage is enabled and firebase-config.js includes the correct storageBucket for the same Firebase project.
F. Test payment submission using a small JPG or PDF under 5 MB.

Important:
- Do not paste storage.rules into Firestore Rules. They belong in Firebase Storage > Rules.
- The payment proof is uploaded to Storage first, then a paymentSubmissions document is created in Firestore.
- Admin approval is still required before the payment is counted as paid.
- Cancellation approval does not automatically refund money.
- Keep the existing firebase-config.js; do not replace it with a sample config.
