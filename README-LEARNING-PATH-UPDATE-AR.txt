Highfield Egypt Learning Portal — Learning Path Update

Files to replace in the existing repository:
- trainee-dashboard.html
- portal.js
- portal.css
- firestore.rules

What this update adds:
1. Two student learning paths:
   - Annual Medical Program: total commitment 61,000 EGP.
     First scheduled amount: 6,000 EGP (1,000 registration + first 5,000 installment).
     Following monthly scheduled amounts: 5,000 EGP.
   - Individual programs: choose from the existing HIGHFIELD_PROGRAMS catalog.
     The fee is displayed using the existing js/program-pricing.js calculation.
2. Enrollment requests stored in programEnrollments.
3. Per-enrollment total, approved paid amount, and remaining balance.
4. Payment proof submission linked to the selected enrollment.
5. Admin view of enrollment requests and manual enrollment support, using the existing admin dashboard form.
6. Dashboard chart heading changed to "مسار التطوير المستمر".

Deployment:
- Back up current files first.
- Replace only the four files above in the repository root.
- Publish the included Firestore rules in Firebase Console > Firestore Database > Rules.
- Do not replace firebase-config.js, programs.js, program-pricing.js, or the rest of the website.
- Hard refresh the browser after GitHub Pages finishes deploying.

Important:
- This update records student requests and payment proofs. It does not charge cards or integrate an online payment gateway.
- The displayed program price is calculated in the browser. The admin must verify the current official fee before approving an enrollment/payment. For production-grade price enforcement, move price calculation and enrollment creation to a trusted Cloud Function.
- Program enrollment confirmation and payment approval remain separate states.
- The annual program amount is modeled as 61,000 EGP (60,000 annual tuition + 1,000 registration). The initial scheduled amount is 6,000 EGP, then 5,000 EGP monthly.
