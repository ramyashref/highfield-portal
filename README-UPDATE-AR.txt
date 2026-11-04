Highfield Egypt Learning Portal — Payment Date & Amount Update

Included files:
- trainee-dashboard.html
- admin-dashboard.html
- portal.js
- portal.css
- firestore.rules

Changes:
1. The trainee records only the payment date and amount, linked to the selected enrollment.
2. No receipt, image, PDF, payment method, Firebase Storage bucket, or Storage Rules are required.
3. Every submitted payment is saved with status pending and is not counted as paid.
4. The admin dashboard shows trainee, program, amount, payment date, and review actions.
5. Admin can approve or reject a payment. Rejection requires a reason.
6. Approval uses a Firestore transaction so the payment, trainee paid total, and related enrollment balance are updated together and cannot be counted twice by repeated approval.
7. Rejected and pending payments do not affect the paid balance.

Deployment:
A. Back up the current portal files and Firestore Rules.
B. Replace the matching files in the website repository with the files in this package.
C. Publish firestore.rules in Firebase Console > Firestore Database > Rules.
D. Do not configure Firebase Storage for this payment workflow.
E. Test with a trainee account: submit date + amount, then approve/reject from the admin account.

Notes:
- Keep the existing firebase-config.js unchanged.
- Historical payment documents that contain proofUrl/proofPath remain readable; this update stops creating new receipt uploads.
- Firestore Security Rules still verify that the selected enrollment belongs to the signed-in trainee and that the amount does not exceed the remaining fee.
