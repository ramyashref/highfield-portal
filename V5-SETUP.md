# Highfield Egypt V5

## Included
- 134 searchable program cards
- Dedicated dynamic page for every program
- Automatic intake month:
  - Starts at August 2026
  - Moves to the following month automatically on day 25
- Every program is shown as Online and On-site
- Program overview, learning outcomes, and target audience
- Unified registration form
- WhatsApp integration: 01101669115
- No fees displayed
- Existing verification, accreditation, council, and V4 design retained

## Google Sheets registration connection
The website works immediately with a WhatsApp fallback. To store registration directly in Google Sheets:

1. Create a Google Sheet and open Extensions → Apps Script.
2. Paste the sample below.
3. Deploy as Web App with access set to “Anyone”.
4. Copy the deployment URL.
5. Open `js/config.js` and put the URL in:
   `registrationApiUrl: "YOUR_DEPLOYED_WEB_APP_URL"`

### Apps Script sample

```javascript
const SHEET_NAME = 'Registrations';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        'Submitted At', 'Program ID', 'Program Name', 'Intake Month',
        'Full Name', 'Mobile Number', 'Email', 'National ID',
        'WhatsApp Number', 'Professional License Number',
        'Workplace', 'Academic Degree', 'Specialty', 'Governorate',
        'Attendance Mode', 'Consent', 'Source Page'
      ]);
    }

    sheet.appendRow([
      data.submittedAt || new Date().toISOString(),
      data.programId || '',
      data.programName || '',
      data.intakeMonth || '',
      data.fullName || '',
      data.mobileNumber || '',
      data.email || '',
      data.nationalId || '',
      data.whatsappNumber || '',
      data.licenseNumber || '',
      data.workplace || '',
      data.academicDegree || '',
      data.specialty || '',
      data.governorate || '',
      data.attendanceMode || '',
      data.consent || '',
      data.sourcePage || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Program links
Program pages use a single dynamic template, for example:
- `program.html?id=1`
- `program.html?id=84`
- `program.html?id=134`
