function currentTime() {
  var d = new Date();
  var currentTime = d.toLocaleTimeString();
  return currentTime;
}
function WEBHOOK() {
  const properties = PropertiesService.getScriptProperties();
  const token = properties.getProperty('api_key');
  const username = properties.getProperty('user_name');
  const ref = properties.getProperty('git_ref');
  const url = properties.getProperty('api_url');
  var headers = {
    Authorization: "Basic " + Utilities.base64Encode(username + ':' + token),
    Accept: 'application/vnd.github.v3+json',
  };
  
  var options = {
    headers: headers, 
    method: 'post',
    payload: JSON.stringify({ref: ref}),
  };
 
  UrlFetchApp.fetch(url, options);
  
  return `Updated at: ${currentTime()}`;
}
