// Create a new panel
chrome.devtools.panels.elements.createSidebarPane(
  chrome.i18n.getMessage("devtoolsPanelTitle"),
  function (sidebar) {
    sidebar.setPage("src/devtools/sidebar.html");
  }
);
