function currentTime() {
  var d = new Date();
  var currentTime = d.toLocaleTimeString();
  return currentTime;
}
function escape(value) {
  return '"'+String(value).replace(/"/g, '\\\"')+'"';
}
function toRow(ary) {
  return ary.map(escape).join(",");
}
function toCsv(data) {
  return data.map(toRow).join("\n");
}
function compress(string) {
  const blob = Utilities.newBlob(string);
  return Utilities.base64Encode(Utilities.gzip(blob).getBytes());
}
function WEBHOOK() {
  const properties = PropertiesService.getScriptProperties();
  const token = properties.getProperty('api_key');
  const username = properties.getProperty('user_name');
  const ref = properties.getProperty('git_ref');
  const url = properties.getProperty('api_url');
  const tab = properties.getProperty('tab_name');
  const range = properties.getProperty('range');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tab);
  const dataRange = sheet.getRange(range);
  const data = dataRange.getValues(); // returns an array of arrays
  
  var headers = {
    Authorization: "Basic " + Utilities.base64Encode(username + ':' + token),
    Accept: 'application/vnd.github.v3+json',
  };
  
  var options = {
    headers: headers, 
    method: 'post',
    payload: JSON.stringify({ref: ref, inputs: {data: compress(toCsv(data))}}),
  };
 
  UrlFetchApp.fetch(url, options);
  
  return `Updated at: ${currentTime()}`;
}
