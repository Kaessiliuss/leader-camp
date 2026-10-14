/**
 * Collects the circulaire's registrations and discussion topics into a Google Sheet.
 *
 * Setup (5 minutes):
 *  1. Create a Google Sheet → Extensions → Apps Script. Replace the editor's contents with this file. Save.
 *  2. Deploy → New deployment → type "Web app".
 *     Execute as: Me · Who has access: Anyone → Deploy, then authorise.
 *  3. Copy the web-app URL (ends in /exec) into src/config.js:
 *       const SHEET_URL = 'https://script.google.com/macros/s/XXXX/exec';
 *  4. Rebuild the site (npm run build). Rows appear in two tabs: "Registrations" and "Topics".
 *
 * One response = one row in "Registrations". If someone declines and then changes their mind,
 * the same row is updated (matched by responseId) instead of a second row being added.
 *
 * If you edit this script later, use Deploy → Manage deployments → Edit → New version, so the URL stays the same.
 */

const TABS = {
  registration: {
    name: 'Registrations',
    columns: ['sentAt', 'name', 'lane', 'role', 'phone', 'diet', 'attending', 'areYouSureClicks', 'note', 'responseId'],
  },
  topic: {
    name: 'Topics',
    columns: ['sentAt', 'name', 'attending', 'topic', 'responseId'],
  },
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    const tab = TABS[data.type];
    if (!tab) return ContentService.createTextOutput('unknown type');

    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName(tab.name) || book.insertSheet(tab.name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(tab.columns);
      sheet.setFrozenRows(1);
    }
    const row = tab.columns.map((key) => String(data[key] ?? '').slice(0, 2000));

    // registrations: update this response's row if it already exists
    if (data.type === 'registration' && data.responseId) {
      const idCol = tab.columns.indexOf('responseId') + 1;
      const last = sheet.getLastRow();
      if (last > 1) {
        const ids = sheet.getRange(2, idCol, last - 1, 1).getValues();
        const at = ids.findIndex(([id]) => id === data.responseId);
        if (at !== -1) {
          sheet.getRange(at + 2, 1, 1, row.length).setValues([row]);
          return ContentService.createTextOutput('updated');
        }
      }
    }

    sheet.appendRow(row);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the /exec URL in a browser to check the deployment is alive.
function doGet() {
  return ContentService.createTextOutput('Leaders camp circulaire endpoint is running.');
}
