# SCI HSE Dashboard — Setup Guide

## 1. Create the Google Sheet
1. Go to sheets.google.com > create a new blank spreadsheet.
2. Rename it e.g. "SCI HSE Dashboard Data".
3. You don't need to create the tabs manually — the script auto-creates
   `Tasks`, `Observations`, `Notes` the first time it runs. But you can
   create them yourself first if you want to pre-fill data:

   **Tasks** tab — columns: `ID | Task | Status | DateAdded`
   (Status values must be exactly: `To Do`, `In Progress`, `Done`)

   **Observations** tab — columns: `Month | Count`
   (Month as short label e.g. `Nov`, `Dec`, `Jan` — add one row per month,
   most recent 6 rows are shown on the trend chart)

   **Notes** tab — columns: `ID | Text | DateAdded`

## 2. Deploy the backend (Apps Script)
1. In the Sheet, go to **Extensions > Apps Script**.
2. Delete the default `Code.gs` content and paste in the `Code.gs` from
   this project.
3. Click **Deploy > New deployment**.
4. Type: **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, authorize the permissions when prompted.
6. Copy the **Web App URL** it gives you (ends in `/exec`).

## 3. Connect the frontend
1. Open `index.html`.
2. Find this line near the top of the `<script>` block:
   ```js
   const CONFIG = {
     API_URL: 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'
   };
   ```
3. Replace the placeholder with the Web App URL from step 2.6.
4. Save.

## 4. Deploy to GitHub Pages (same pattern as your other tools)
1. Push `index.html` and `manifest.json` to a new/existing GitHub repo.
2. Repo Settings > Pages > deploy from `main` branch, root folder.
3. Open the published URL — the dashboard should load live data from
   your Sheet.

## Notes
- Clicking the status dropdown on a task card updates the sheet
  immediately and moves the card to the right column.
- "Task Status" pie and column counts are calculated automatically from
  the `Tasks` sheet — no manual entry needed.
- "Log" under Safety Observations writes/overwrites the count for the
  current month automatically (based on today's date).
- If a task card shows "Could not connect", double-check the API_URL and
  that the deployment access is set to **Anyone**.
