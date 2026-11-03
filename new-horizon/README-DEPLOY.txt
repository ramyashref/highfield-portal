NEW HORIZON 2027 — Website v2 (New Visual Identity + Abstracts)

FILES TO UPLOAD
- index.html
- abstracts.html
- assets/css/style.css
- assets/js/main.js
- assets/js/abstracts-config.js
- assets/images/new-horizon-key-visual.png

Keep the rest of the existing website pages and assets in place.

VISUAL IDENTITY
The updated homepage follows the supplied Integrated Brochure: deep navy, champagne gold, white/silver typography and the extracted key visual artwork.

ABSTRACTS PAGE
The new page is abstracts.html. It contains the requested submission fields:
1. Full name in Arabic (four names)
2. Full name in English (four names)
3. WhatsApp number
4. Email
5. Workplace / institution
6. Faculty / college
7. Highest academic degree
8. Abstract PDF upload
9. Presentation video upload

GOOGLE FORM CONNECTION
The page is prepared to embed a Google Form. The input preview is disabled until the real Google Form is connected; this prevents visitors from entering details into a form that is not yet wired to receive submissions.

To connect:
1. Create a Google Form with the nine fields above.
2. Make the first seven questions Short answer (required).
3. Add a File upload question for the abstract and restrict it to PDF.
4. Add a File upload question for the video and choose the allowed video formats / size.
5. In Google Forms, use Send > Embed HTML and copy the iframe src URL.
6. Open assets/js/abstracts-config.js and paste the URL:
   window.NH_GOOGLE_FORM_EMBED_URL = "YOUR_EMBED_URL";
7. Upload the updated abstracts-config.js to GitHub Pages.

IMPORTANT GOOGLE FORMS NOTE
Google Forms file-upload questions generally require the submitter to sign in to a Google account. The file-upload limits and accepted video formats are controlled in Google Forms, not by this website. The actual form URL is still needed to complete the connection.

EXISTING BOOKING
The workshop cart, conference-day package and WhatsApp booking flow from the previous update are retained.
WhatsApp destination: +20 110 166 9115.
