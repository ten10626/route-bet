const SHEET_NAME = "お題候補";
const HEADERS = ["投稿日時", "質問文"];

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents);
    const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
    const questions = candidates
      .map((candidate) => String(candidate.question || "").trim())
      .filter(Boolean);

    if (questions.length === 0) {
      return jsonResponse_({
        success: false,
        message: "質問候補がありません。"
      });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getOrCreateSheet_();
      const submittedAt = new Date();
      const rows = questions.map((question) => [submittedAt, question]);
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
      sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).setNumberFormat("yyyy/MM/dd HH:mm");
    } finally {
      lock.releaseLock();
    }

    return jsonResponse_({
      success: true,
      savedCount: questions.length
    });
  } catch (error) {
    return jsonResponse_({
      success: false,
      message: error.message
    });
  }
}

function doGet() {
  return jsonResponse_({
    success: true,
    message: "ROUTE BET question submission endpoint"
  });
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
