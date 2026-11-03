HIGHFIELD EGYPT LEARNING PORTAL — IMPLEMENTATION NOTES

Included in this update:
- Updated trainee dashboard with an Explore Programs catalog sourced from js/programs.js.
- Program prices follow the existing js/program-pricing.js pricing tiers:
  Basic 2,000 EGP; Intermediate 4,000 EGP; Advanced 8,000 EGP.
- Trainees can request additional-program enrollment and submit a transfer receipt.
- Admin can add a trainee to an additional program directly and mark payment as unpaid, paid, or waived.
- Admin can review additional-program requests and pending payment proofs.
- Additional-program payment approvals do not change the annual subscription balance.
- Firestore rules include a programEnrollments collection.

IMPORTANT DEPLOYMENT STEPS:
1. Back up the live repository.
2. Upload the changed files while preserving all other site files:
   portal.js, portal.css, trainee-dashboard.html, admin-dashboard.html, trainee-login.html, annual-medical-program.html, index.html, js/program-pricing.js, firestore.rules.
3. Publish the updated Firestore rules in Firebase Console > Firestore Database > Rules.
4. Verify Firebase Authentication email/password and Google sign-in providers are enabled.
5. Test with a trainee account and the verified admin account info@highfieldeg.com.
6. A trainee must create an account with their full name before the admin can select them for direct enrollment.

LIMITATIONS / NOT YET CONNECTED:
- Online card payment is not active because no payment gateway/provider credentials or merchant account were supplied. The UI labels this as future activation; it does not pretend to charge a card.
- WhatsApp/contact enrollment is represented as a pending request, with a direct WhatsApp contact link. The admin can confirm the request from the dashboard.
- Certificate issuance, attendance entry, trainer roles, and annual completion calculations are not implemented in this first portal iteration.
- This is a front-end + Firestore-rules implementation. Publish rules before using the new collection in production.
