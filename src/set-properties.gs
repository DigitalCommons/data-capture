// An example of how to set the sheet properties programmatically
function setProperties() {
  const properties = PropertiesService.getScriptProperties();
  properties
    .setProperty("user_name", "sea-bot")
    .setProperty("git_ref", "deep-adaptation")
    .setProperty("tab_name", "map data")
    .setProperty("range", "E:AM")
    .setProperty("api_url", "https://api.github.com/repos/SolidarityEconomyAssociation/data-capture/actions/workflows/download.yml/dispatches")
    // .setProperty("api_key", "redacted")
}
