import {
  buildDomain,
  buildGeneratedConfig,
  buildTemplateConfig,
  createDownloadName,
  normalizeDomainPrefix,
  validateConfigInput
} from "./yealink-cfg.js";

const views = ["device", "multiple", "search", "contacts", "configuration"];
const navButtons = Array.from(document.querySelectorAll("[data-view]"));
const workspaceTitle = document.querySelector("#workspace-title");
const quickAddButton = document.querySelector("#quick-add-button");
const logoutButton = document.querySelector("#logout-button");
const sessionUser = document.querySelector("#session-user");

const authLoading = document.querySelector("#auth-loading");
const loginShell = document.querySelector("#login-shell");
const appShell = document.querySelector("#app-shell");
const loginForm = document.querySelector("#login-form");
const loginSubmitButton = document.querySelector("#login-submit");
const loginResponse = document.querySelector("#login-response");
const loginResponseBadge = document.querySelector("#login-response-badge");
const loginResponseMessage = document.querySelector("#login-response-message");

const deviceForm = document.querySelector("#device-form");
const modelInput = document.querySelector("#model-input");
const selectedModelIdInput = document.querySelector("#selected-model-id");
const modelMenu = document.querySelector("#model-menu");
const modelToggle = document.querySelector("#model-toggle");
const siteInput = document.querySelector("#site-input");
const selectedSiteIdInput = document.querySelector("#selected-site-id");
const siteMenu = document.querySelector("#site-menu");
const siteToggle = document.querySelector("#site-toggle");
const responsePanel = document.querySelector("#response-panel");
const responseBadge = document.querySelector("#response-badge");
const responseMessage = document.querySelector("#response-message");
const saveButton = document.querySelector("#save-button");

const batchForm = document.querySelector("#batch-form");
const batchRows = document.querySelector("#batch-rows");
const batchReadyCount = document.querySelector("#batch-ready-count");
const batchAddRowButton = document.querySelector("#batch-add-row");
const batchSaveButton = document.querySelector("#batch-save-button");
const batchResponsePanel = document.querySelector("#batch-response-panel");
const batchResponseBadge = document.querySelector("#batch-response-badge");
const batchResponseMessage = document.querySelector("#batch-response-message");
const batchTemplateButton = document.querySelector("#batch-template-button");
const batchUploadButton = document.querySelector("#batch-upload-button");
const batchUploadInput = document.querySelector("#batch-upload-input");
const batchSiteInput = document.querySelector("#batch-site-input");
const selectedBatchSiteIdInput = document.querySelector("#selected-batch-site-id");
const batchSiteMenu = document.querySelector("#batch-site-menu");
const batchSiteToggle = document.querySelector("#batch-site-toggle");
const batchSiteNote = document.querySelector("#batch-site-note");

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const searchClearButton = document.querySelector("#search-clear-button");
const searchFilterInput = document.querySelector("#search-filter-input");
const searchFilterClearButton = document.querySelector("#search-filter-clear-button");
const searchResults = document.querySelector("#search-results");
const searchScope = document.querySelector("#search-scope");
const searchScopeTitle = document.querySelector("#search-scope-title");
const searchScopeDetails = document.querySelector("#search-scope-details");
const searchTotalCount = document.querySelector("#search-total-count");
const searchOnlineCount = document.querySelector("#search-online-count");
const searchOfflineCount = document.querySelector("#search-offline-count");
const searchPendingCount = document.querySelector("#search-pending-count");
const searchInactiveCount = document.querySelector("#search-inactive-count");
const searchTotalCountInline = document.querySelector("#search-total-count-inline");
const searchOnlineCountInline = document.querySelector("#search-online-count-inline");
const searchOfflineCountInline = document.querySelector("#search-offline-count-inline");
const searchPendingCountInline = document.querySelector("#search-pending-count-inline");
const searchInactiveCountInline = document.querySelector("#search-inactive-count-inline");
const statusFilterButtons = Array.from(document.querySelectorAll("[data-status-filter]"));

const contactsReadyCount = document.querySelector("#contacts-ready-count");
const contactsFixedCount = document.querySelector("#contacts-fixed-count");
const contactsSkippedCount = document.querySelector("#contacts-skipped-count");
const contactsFileName = document.querySelector("#contacts-file-name");
const contactsTemplateButton = document.querySelector("#contacts-template-button");
const contactsUploadButton = document.querySelector("#contacts-upload-button");
const contactsUploadInput = document.querySelector("#contacts-upload-input");
const contactsGenerateButton = document.querySelector("#contacts-generate-button");
const contactsPreview = document.querySelector("#contacts-preview");
const contactsResponsePanel = document.querySelector("#contacts-response-panel");
const contactsResponseBadge = document.querySelector("#contacts-response-badge");
const contactsResponseMessage = document.querySelector("#contacts-response-message");

const configForm = document.querySelector("#config-form");
const configDomainInput = document.querySelector("#config-domain");
const configExtensionInput = document.querySelector("#config-extension");
const configPasswordInput = document.querySelector("#config-password");
const configDomainPreview = document.querySelector("#config-domain-preview");
const configPreview = document.querySelector("#config-preview");
const configStatusPill = document.querySelector("#config-status-pill");
const configResponsePanel = document.querySelector("#config-response-panel");
const configResponseBadge = document.querySelector("#config-response-badge");
const configResponseMessage = document.querySelector("#config-response-message");
const configGenerateButton = document.querySelector("#config-generate-button");
const configDownloadButton = document.querySelector("#config-download-button");
const configTemplateButton = document.querySelector("#config-template-button");
const configDsskeyToggleButton = document.querySelector("#config-dsskey-toggle");
const configDsskeyAddButton = document.querySelector("#config-dsskey-add");
const configW70bAddButton = document.querySelector("#config-w70b-add");
const configW70bCheckbox = document.querySelector("#config-is-w70b");
const configDsskeyPanel = document.querySelector("#config-dsskey-panel");
const configW70bPanel = document.querySelector("#config-w70b-panel");
const configDsskeyRows = document.querySelector("#config-dsskey-rows");
const configW70bRows = document.querySelector("#config-w70b-rows");

const modelCount = document.querySelector("#model-count");
const siteCount = document.querySelector("#site-count");
const deviceSiteNote = document.querySelector("#device-site-note");

let modelItems = [];
let siteItems = [];
let filteredModelItems = [];
let filteredSiteItems = [];
let modelActiveIndex = -1;
let siteActiveIndex = -1;
let batchSiteActiveIndex = -1;
let batchRowSequence = 0;
let searchResultItems = [];
let activeStatusFilter = "all";
let appInitialized = false;
let currentUser = null;
let currentView = "device";
let searchRefreshTimer = null;
let contactsSourceFileName = "";
let contactItems = [];
let contactFixedRows = 0;
let contactSkippedRows = 0;
let configurationToolInitialized = false;
let configurationDssExpanded = false;

function setCounterText(element, value) {
  if (element) {
    element.textContent = String(value);
  }
}

function resetSearchCounters() {
  setCounterText(searchTotalCount, 0);
  setCounterText(searchOnlineCount, 0);
  setCounterText(searchOfflineCount, 0);
  setCounterText(searchPendingCount, 0);
  setCounterText(searchInactiveCount, 0);
  setCounterText(searchTotalCountInline, 0);
  setCounterText(searchOnlineCountInline, 0);
  setCounterText(searchOfflineCountInline, 0);
  setCounterText(searchPendingCountInline, 0);
  setCounterText(searchInactiveCountInline, 0);
}

function renderContactPreview(items) {
  contactsPreview.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "contacts-preview-empty";
    empty.textContent = "Upload a CSV file to preview the cleaned phone numbers before generating XML.";
    contactsPreview.append(empty);
    return;
  }

  items.slice(0, 25).forEach((item) => {
    const row = document.createElement("div");
    row.className = "contacts-preview-row";
    row.innerHTML = `
      <span class="contacts-preview-cell">
        <small class="contacts-preview-label">Name</small>
        <strong class="contacts-preview-value">${escapeHtml(item.display_name)}</strong>
      </span>
      <span class="contacts-preview-cell">
        <small class="contacts-preview-label">Original Number</small>
        <span class="contacts-preview-value">${escapeHtml(item.original_number || "-")}</span>
      </span>
      <span class="contacts-preview-cell">
        <small class="contacts-preview-label">XML Number</small>
        <span class="contacts-preview-value">${escapeHtml(item.office_number || "-")}</span>
      </span>
      <span class="contacts-preview-cell">
        <small class="contacts-preview-label">Status</small>
        <span class="contacts-status-pill ${item.wasFixed ? "contacts-status-pill-fixed" : "contacts-status-pill-ready"}">${item.wasFixed ? "Corrected" : "Ready"}</span>
      </span>
    `;
    contactsPreview.append(row);
  });

  if (items.length > 25) {
    const more = document.createElement("div");
    more.className = "contacts-preview-empty";
    more.textContent = `Preview limited to the first 25 rows. ${items.length - 25} more contacts are ready for XML export.`;
    contactsPreview.append(more);
  }
}

function resetContactsGenerator() {
  contactsSourceFileName = "";
  contactItems = [];
  contactFixedRows = 0;
  contactSkippedRows = 0;
  contactsFileName.textContent = "No CSV selected yet.";
  setCounterText(contactsReadyCount, 0);
  setCounterText(contactsFixedCount, 0);
  setCounterText(contactsSkippedCount, 0);
  resetResponseState(contactsResponsePanel, contactsResponseMessage);
  renderContactPreview([]);
}

function setConfigurationStatus(text, tone = "ready") {
  configStatusPill.textContent = text;
  configStatusPill.classList.remove(
    "contacts-status-pill-ready",
    "contacts-status-pill-fixed",
    "configuration-status-pill-error"
  );

  if (tone === "error") {
    configStatusPill.classList.add("configuration-status-pill-error");
    return;
  }

  configStatusPill.classList.add(tone === "success" ? "contacts-status-pill-ready" : "contacts-status-pill-fixed");
}

function createConfigurationField(label, controlMarkup) {
  return `
    <label class="configuration-mini-field">
      <span>${label}</span>
      ${controlMarkup}
    </label>
  `;
}

function createConfigurationDssRow(initialValues = {}) {
  const row = document.createElement("div");
  row.className = "configuration-row configuration-dss-grid";

  const lineOptions = Array.from({ length: 10 }, (_, index) => {
    const value = String(index + 1);
    const selected = (initialValues.line || "1") === value ? "selected" : "";
    return `<option value="${value}" ${selected}>Line${value}</option>`;
  }).join("");

  row.innerHTML = `
    ${createConfigurationField("Value", `<input data-config-dss-value type="text" inputmode="numeric" value="${escapeHtml(initialValues.value || "")}" placeholder="201">`)}
    ${createConfigurationField("Label", `<input data-config-dss-label type="text" value="${escapeHtml(initialValues.label || "")}" placeholder="201">`)}
    ${createConfigurationField("Line", `<select data-config-dss-line>${lineOptions}</select>`)}
    ${createConfigurationField("Extension", `<input data-config-dss-extension type="text" value="${escapeHtml(initialValues.extension || "**")}" placeholder="**">`)}
    <button type="button" class="row-remove">Remove</button>
  `;

  row.addEventListener("input", updateConfigurationPreview);
  row.addEventListener("change", updateConfigurationPreview);
  row.querySelector(".row-remove").addEventListener("click", () => {
    row.remove();
    updateConfigurationPreview();
  });

  return row;
}

function createConfigurationW70bRow(initialValues = {}) {
  const row = document.createElement("div");
  row.className = "configuration-row configuration-w70b-grid";
  row.innerHTML = `
    ${createConfigurationField("Extension", `<input data-config-w70b-extension type="text" inputmode="numeric" value="${escapeHtml(initialValues.extension || "")}" placeholder="201">`)}
    ${createConfigurationField("Password Override", `<input data-config-w70b-password type="text" value="${escapeHtml(initialValues.password || "")}" placeholder="Use main password if empty">`)}
    <button type="button" class="row-remove">Remove</button>
  `;

  row.addEventListener("input", updateConfigurationPreview);
  row.addEventListener("change", updateConfigurationPreview);
  row.querySelector(".row-remove").addEventListener("click", () => {
    row.remove();
    updateConfigurationPreview();
  });

  return row;
}

function ensureConfigurationStarterRows() {
  if (!configDsskeyRows.children.length) {
    configDsskeyRows.append(createConfigurationDssRow());
  }

  if (!configW70bRows.children.length) {
    configW70bRows.append(createConfigurationW70bRow());
  }
}

function getConfigurationDssRows() {
  return Array.from(configDsskeyRows.querySelectorAll(".configuration-row")).map((row) => ({
    value: row.querySelector("[data-config-dss-value]")?.value || "",
    label: row.querySelector("[data-config-dss-label]")?.value || "",
    line: row.querySelector("[data-config-dss-line]")?.value || "1",
    extension: row.querySelector("[data-config-dss-extension]")?.value || "**"
  }));
}

function getConfigurationW70bRows() {
  return Array.from(configW70bRows.querySelectorAll(".configuration-row")).map((row) => ({
    extension: row.querySelector("[data-config-w70b-extension]")?.value || "",
    password: row.querySelector("[data-config-w70b-password]")?.value || ""
  }));
}

function getConfigurationState() {
  return {
    domainPrefix: normalizeDomainPrefix(configDomainInput.value),
    extension: configExtensionInput.value.trim(),
    password: configPasswordInput.value.trim(),
    isW70B: Boolean(configW70bCheckbox.checked),
    dssKeys: getConfigurationDssRows(),
    additionalAccounts: getConfigurationW70bRows()
  };
}

function syncConfigurationDomainPreview() {
  configDomainPreview.textContent = buildDomain(configDomainInput.value) || "1234.nimbusip.com";
}

function syncConfigurationMode() {
  const isW70B = configW70bCheckbox.checked;
  configW70bPanel.classList.toggle("hidden", !isW70B);
  configDsskeyPanel.classList.toggle("hidden", isW70B || !configurationDssExpanded);
  configDsskeyToggleButton.disabled = isW70B;
  configDsskeyAddButton.disabled = isW70B;
  configW70bAddButton.disabled = !isW70B;
  configDsskeyToggleButton.textContent = isW70B ? "Dsskey Disabled For W70B" : "Dsskey";
}

function updateConfigurationPreview() {
  syncConfigurationDomainPreview();
  syncConfigurationMode();

  const state = getConfigurationState();
  const validation = validateConfigInput(state);

  if (validation.errors.length > 0) {
    configPreview.textContent = "Complete the required fields to generate the cfg preview.";
    configDownloadButton.disabled = true;
    setConfigurationStatus("Needs Input", "error");

    if (state.domainPrefix || state.extension || state.password || state.isW70B) {
      setResponseState(
        configResponsePanel,
        configResponseBadge,
        configResponseMessage,
        false,
        validation.errors[0]
      );
    } else {
      resetResponseState(configResponsePanel, configResponseMessage);
    }
    return;
  }

  const generated = buildGeneratedConfig(state);
  configPreview.textContent = generated.content;
  configDownloadButton.disabled = false;
  setConfigurationStatus(state.isW70B ? "W70B Ready" : "CFG Ready", "success");
  setResponseState(
    configResponsePanel,
    configResponseBadge,
    configResponseMessage,
    true,
    state.isW70B
      ? "W70B cfg preview is ready. Extra account passwords use the main password when left empty."
      : "CFG preview is ready. Dsskey BLF rows start from linekey.2."
  );
}

function resetConfigurationTool() {
  configurationDssExpanded = false;
  configForm.reset();
  configDsskeyRows.innerHTML = "";
  configW70bRows.innerHTML = "";
  ensureConfigurationStarterRows();
  configPreview.textContent = "Complete the required fields to generate the cfg preview.";
  configDownloadButton.disabled = true;
  resetResponseState(configResponsePanel, configResponseMessage);
  setConfigurationStatus("Ready", "ready");
  syncConfigurationDomainPreview();
  syncConfigurationMode();
}

function initializeConfigurationTool() {
  if (configurationToolInitialized) {
    return;
  }

  configurationToolInitialized = true;
  resetConfigurationTool();

  configForm.addEventListener("input", (event) => {
    if (event.target === configDomainInput) {
      const digitsOnly = configDomainInput.value.replace(/\D+/g, "");
      if (digitsOnly !== configDomainInput.value) {
        configDomainInput.value = digitsOnly;
      }
    }
    updateConfigurationPreview();
  });

  configForm.addEventListener("change", updateConfigurationPreview);

  configGenerateButton.addEventListener("click", () => {
    updateConfigurationPreview();
    configPreview.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  configTemplateButton.addEventListener("click", () => {
    downloadTextFile(buildTemplateConfig(), "yealink-static-template.cfg", "text/plain;charset=utf-8");
    setConfigurationStatus("Template Downloaded", "ready");
    setResponseState(
      configResponsePanel,
      configResponseBadge,
      configResponseMessage,
      true,
      "Static cfg template downloaded."
    );
  });

  configDownloadButton.addEventListener("click", () => {
    const state = getConfigurationState();
    const generated = buildGeneratedConfig(state);

    if (generated.errors.length > 0) {
      setConfigurationStatus("Needs Input", "error");
      setResponseState(
        configResponsePanel,
        configResponseBadge,
        configResponseMessage,
        false,
        generated.errors[0]
      );
      return;
    }

    downloadTextFile(generated.content, createDownloadName(state), "text/plain;charset=utf-8");
    setConfigurationStatus("Downloaded", "success");
    setResponseState(
      configResponsePanel,
      configResponseBadge,
      configResponseMessage,
      true,
      "Generated cfg downloaded."
    );
  });

  configDsskeyToggleButton.addEventListener("click", () => {
    if (configW70bCheckbox.checked) {
      return;
    }

    configurationDssExpanded = !configurationDssExpanded;
    if (configurationDssExpanded && !configDsskeyRows.children.length) {
      configDsskeyRows.append(createConfigurationDssRow());
    }
    syncConfigurationMode();
  });

  configDsskeyAddButton.addEventListener("click", () => {
    configurationDssExpanded = true;
    configDsskeyRows.append(createConfigurationDssRow());
    syncConfigurationMode();
    updateConfigurationPreview();
  });

  configW70bAddButton.addEventListener("click", () => {
    configW70bRows.append(createConfigurationW70bRow());
    updateConfigurationPreview();
  });
}

function resetAppState() {
  modelItems = [];
  siteItems = [];
  filteredModelItems = [];
  filteredSiteItems = [];
  modelActiveIndex = -1;
  siteActiveIndex = -1;
  batchSiteActiveIndex = -1;
  batchRowSequence = 0;
  searchResultItems = [];
  activeStatusFilter = "all";
  appInitialized = false;
  currentView = "device";

  if (searchRefreshTimer) {
    window.clearInterval(searchRefreshTimer);
    searchRefreshTimer = null;
  }

  hideMenu(modelMenu, modelInput);
  hideMenu(siteMenu, siteInput);
  hideMenu(batchSiteMenu, batchSiteInput);

  deviceForm.reset();
  resetBatchForm();

  selectedModelIdInput.value = "";
  selectedSiteIdInput.value = "";
  selectedBatchSiteIdInput.value = "";
  searchInput.value = "";
  searchFilterInput.value = "";
  searchResults.innerHTML = "";
  searchScope.textContent = "Searching inside NIMBUSIP";
  searchScopeTitle.textContent = "NIMBUSIP";
  searchScopeDetails.textContent = "Loading site scope from YMCS...";
  modelCount.textContent = "0";
  siteCount.textContent = "0";
  resetSearchCounters();
  resetContactsGenerator();
  resetConfigurationTool();
  resetResponseState(responsePanel, responseMessage);
  resetResponseState(batchResponsePanel, batchResponseMessage);
  updateInputClearButton(searchInput, searchClearButton);
  updateInputClearButton(searchFilterInput, searchFilterClearButton);
  syncActiveStatusButtons();
}

function showMenu(menu, input) {
  menu.classList.remove("hidden");
  input.setAttribute("aria-expanded", "true");
}

function hideMenu(menu, input) {
  menu.classList.add("hidden");
  input.setAttribute("aria-expanded", "false");
}

function setResponseState(panel, badge, messageElement, ok, message) {
  panel.classList.remove("hidden", "response-success", "response-error");
  panel.classList.add(ok ? "response-success" : "response-error");
  badge.textContent = ok ? "Success" : "Failed";
  messageElement.textContent = message || (ok ? "Request completed." : "Request failed.");
}

function resetResponseState(panel, messageElement) {
  panel.classList.add("hidden");
  messageElement.textContent = "";
}

function setAuthView(view) {
  authLoading.classList.toggle("hidden", view !== "loading");
  loginShell.classList.toggle("hidden", view !== "login");
  appShell.classList.toggle("hidden", view !== "app");
  document.body.classList.toggle("login-mode", view === "login");
}

function applySessionUser(user) {
  currentUser = user || null;

  if (user?.email) {
    sessionUser.textContent = `${user.email} (${user.role || "admin"})`;
    sessionUser.classList.remove("hidden");
    return;
  }

  sessionUser.textContent = "";
  sessionUser.classList.add("hidden");
}

function isAdminUser() {
  return currentUser?.role === "admin";
}

function getLockedSiteScope() {
  return currentUser?.siteScope?.locked ? currentUser.siteScope : null;
}

function isLockedSiteUser() {
  return Boolean(getLockedSiteScope());
}

function setSiteControlState(input, hiddenInput, toggle, note, lockedSite) {
  if (!input || !hiddenInput || !toggle) {
    return;
  }

  if (lockedSite) {
    input.value = lockedSite.name;
    hiddenInput.value = lockedSite.siteId;
    input.readOnly = true;
    toggle.disabled = true;
    if (note) {
      note.textContent = `This account is locked to ${lockedSite.name}.`;
    }
    return;
  }

  input.readOnly = false;
  toggle.disabled = false;
}

function applyLockedSiteScopeToInputs() {
  const lockedSite = getLockedSiteScope();

  setSiteControlState(siteInput, selectedSiteIdInput, siteToggle, deviceSiteNote, lockedSite);
  setSiteControlState(batchSiteInput, selectedBatchSiteIdInput, batchSiteToggle, batchSiteNote, lockedSite);

  if (!lockedSite) {
    if (deviceSiteNote) {
      deviceSiteNote.innerHTML = "Choose a YMCS site by name, or paste a raw site ID such as <code>u4encsac</code>.";
    }

    if (batchSiteNote) {
      batchSiteNote.textContent = "Every imported or manual row in this batch will be added to the selected site.";
    }
  }
}

function activateView(view) {
  currentView = view;
  appShell.dataset.view = view;

  for (const item of views) {
    document.querySelector(`#${item}-workspace`)?.classList.toggle("hidden", item !== view);
    document.querySelector(`#${item}-drawer`)?.classList.toggle("hidden", item !== view);
  }

  navButtons.forEach((button) => {
    button.classList.toggle("nav-link-active", button.dataset.view === view);
  });

  workspaceTitle.textContent = view === "search"
    ? "Search Devices"
    : view === "multiple"
      ? "Multiple Devices"
      : view === "contacts"
        ? "Contacts Generate"
        : view === "configuration"
          ? "Configuration"
          : "NIMBUSIP";
  quickAddButton.classList.toggle("hidden", view === "contacts" || view === "configuration");

  syncSearchAutoRefresh();
}

function normalizeCatalogText(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function statusClassName(status) {
  switch (String(status || "").trim().toLowerCase()) {
    case "online":
      return "status-online";
    case "pending":
      return "status-pending";
    case "inactive":
      return "status-inactive";
    case "offline":
    default:
      return "status-offline";
  }
}

function statusIndicatorClassName(status) {
  switch (String(status || "").trim().toLowerCase()) {
    case "online":
      return "status-indicator-online";
    case "pending":
      return "status-indicator-pending";
    case "inactive":
      return "status-indicator-inactive";
    case "offline":
    default:
      return "status-indicator-offline";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSearchServerPortalUrl(serverLabel) {
  const normalizedLabel = String(serverLabel || "").trim().toUpperCase();

  if (normalizedLabel.startsWith("EU")) {
    return "https://eu.ymcs.yealink.com/manager/login";
  }

  if (normalizedLabel.startsWith("US")) {
    return "https://us.ymcs.yealink.com/manager/login";
  }

  return "";
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function downloadTextFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function normalizeCsvHeader(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function findHeaderIndex(headers, aliases) {
  return headers.findIndex((header) => aliases.includes(header));
}

function normalizeContactNumber(value) {
  const original = String(value ?? "").trim();
  const digits = original.replace(/\D/g, "");

  if (!digits) {
    return {
      normalized: "",
      wasFixed: original !== ""
    };
  }

  let normalized = digits;

  if (normalized.startsWith("972")) {
    normalized = normalized.slice(3);
    normalized = normalized.startsWith("0") ? normalized : `0${normalized}`;
  } else if (!normalized.startsWith("0") && normalized.length >= 8 && normalized.length <= 9) {
    normalized = `0${normalized}`;
  }

  return {
    normalized,
    wasFixed: normalized !== original
  };
}

function renderComboMenu(menu, items, emptyText, onSelect) {
  menu.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "combo-option";
    empty.textContent = emptyText;
    menu.append(empty);
    return;
  }

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "combo-option";
    button.textContent = item.label;
    button.addEventListener("click", () => onSelect(item));
    menu.append(button);
  });
}

function renderModels() {
  renderComboMenu(
    modelMenu,
    filteredModelItems.map((item) => ({ ...item, label: item.shortType })),
    "No matching model. You can still paste a raw modelId.",
    (item) => {
      modelInput.value = item.shortType;
      selectedModelIdInput.value = item.modelId || "";
      hideMenu(modelMenu, modelInput);
      modelActiveIndex = -1;
    }
  );
}

function renderSites(menu, input, hiddenInput, stateSetter) {
  renderComboMenu(
    menu,
    filteredSiteItems.map((item) => ({
      ...item,
      label: currentUser?.siteScope?.hideSiteId
        ? item.name
        : item.parentName
          ? `${item.name} (${item.siteId}) - ${item.parentName}`
          : `${item.name} (${item.siteId})`
    })),
    "No matching site. Keep typing or clear the search.",
    (item) => {
      input.value = item.name;
      hiddenInput.value = item.siteId;
      hideMenu(menu, input);
      stateSetter(-1);
    }
  );
}

function findModelOption(value) {
  if (!value) {
    return "";
  }

  const matched = modelItems.find((item) => item.modelId === value || item.shortType.toLowerCase() === value.toLowerCase());
  return matched ? matched.modelId : value;
}

function buildSuccessMessage(payload) {
  const model = modelInput.value.trim() || payload?.requestBody?.modelId || "Unknown model";
  const mac = payload?.payload?.mac || payload?.requestBody?.mac || deviceForm.elements.mac.value.trim();
  return `Device "${model}"  Mac: "${mac}"  Device created successfully.`;
}

function createBatchRow(initialValues = {}) {
  batchRowSequence += 1;
  const row = document.createElement("div");
  row.className = "batch-row";
  row.dataset.rowId = String(batchRowSequence);

  const modelOptions = modelItems
    .map((item) => `<option value="${item.modelId}">${escapeHtml(item.shortType)}</option>`)
    .join("");

  row.innerHTML = `
    <div class="batch-row-grid">
      <input type="text" name="name" placeholder="Device name" value="${escapeHtml(initialValues.name || "")}">
      <input type="text" name="mac" placeholder="MAC" value="${escapeHtml(initialValues.mac || "")}">
      <input type="text" name="sn" placeholder="Serial number" value="${escapeHtml(initialValues.sn || "")}">
      <select name="modelId">
        <option value="">Select model</option>
        ${modelOptions}
      </select>
      <button type="button" class="row-remove">Remove</button>
    </div>
  `;

  row.querySelector("[name='modelId']").value = initialValues.modelId || "";
  row.addEventListener("input", updateBatchReadyCount);
  row.addEventListener("change", updateBatchReadyCount);
  row.querySelector(".row-remove").addEventListener("click", () => {
    if (batchRows.children.length === 1) {
      row.querySelectorAll("input").forEach((input) => {
        input.value = "";
      });
      row.querySelector("[name='modelId']").value = "";
    } else {
      row.remove();
    }
    updateBatchReadyCount();
  });

  return row;
}

function getSelectedBatchSiteId() {
  return selectedBatchSiteIdInput.value.trim() || batchSiteInput.value.trim();
}

function getBatchPayload() {
  const sharedSiteId = getSelectedBatchSiteId();
  return Array.from(batchRows.querySelectorAll(".batch-row"))
    .map((row) => ({
      name: row.querySelector("[name='name']").value.trim(),
      mac: row.querySelector("[name='mac']").value.trim(),
      sn: row.querySelector("[name='sn']").value.trim(),
      modelInput: row.querySelector("[name='modelId']").value.trim(),
      siteId: sharedSiteId
    }))
    .filter((item) => item.name || item.mac || item.sn || item.modelInput);
}

function updateBatchReadyCount() {
  batchReadyCount.textContent = String(Math.max(getBatchPayload().length, 1));
}

function rerenderBatchRows() {
  const previous = getBatchPayload();
  batchRows.innerHTML = "";
  const nextRows = previous.length > 0 ? previous : [{}];

  nextRows.forEach((item) => {
    batchRows.append(createBatchRow({
      name: item.name,
      mac: item.mac,
      sn: item.sn,
      modelId: item.modelInput
    }));
  });

  updateBatchReadyCount();
}

function resetBatchForm() {
  batchRows.innerHTML = "";
  batchRows.append(createBatchRow());
  if (isLockedSiteUser()) {
    applyLockedSiteScopeToInputs();
  } else {
    batchSiteInput.value = "";
    selectedBatchSiteIdInput.value = "";
  }
  resetResponseState(batchResponsePanel, batchResponseMessage);
  updateBatchReadyCount();
}

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current);
  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function mapCsvRows(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    throw new Error("CSV must include a header row and at least one device row.");
  }

  const headers = rows[0].map((value) => value.trim().toLowerCase());
  const nameIndex = headers.indexOf("name");
  const macIndex = headers.indexOf("mac");
  const snIndex = headers.indexOf("sn");
  const modelIndex = headers.indexOf("model");

  if (macIndex === -1 || snIndex === -1 || modelIndex === -1) {
    throw new Error("CSV template must include mac, sn, and model columns.");
  }

  return rows.slice(1).map((values) => ({
    name: values[nameIndex] ? values[nameIndex].trim() : "",
    mac: values[macIndex] ? values[macIndex].trim() : "",
    sn: values[snIndex] ? values[snIndex].trim() : "",
    modelId: findModelOption(values[modelIndex] ? values[modelIndex].trim() : "")
  })).filter((item) => item.name || item.mac || item.sn || item.modelId);
}

function mapContactsCsvRows(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    throw new Error("CSV must include a header row and at least one contact row.");
  }

  const headers = rows[0].map((value) => normalizeCsvHeader(value));
  const nameIndex = findHeaderIndex(headers, ["name", "fullname", "displayname", "contactname"]);
  const numberIndex = findHeaderIndex(headers, ["number", "phone", "phonenumber", "mobile", "mobilenumber", "telephone", "telephonenumber", "tel", "officenumber"]);

  if (nameIndex === -1 || numberIndex === -1) {
    throw new Error("CSV must include name and number columns.");
  }

  const contacts = [];
  let fixedCount = 0;
  let skippedCount = 0;

  rows.slice(1).forEach((values) => {
    const displayName = values[nameIndex] ? values[nameIndex].trim() : "";
    const originalNumber = values[numberIndex] ? values[numberIndex].trim() : "";

    if (!displayName && !originalNumber) {
      return;
    }

    const normalizedNumber = normalizeContactNumber(originalNumber);

    if (!displayName || !normalizedNumber.normalized) {
      skippedCount += 1;
      return;
    }

    if (normalizedNumber.wasFixed) {
      fixedCount += 1;
    }

    contacts.push({
      display_name: displayName,
      office_number: normalizedNumber.normalized,
      mobile_number: "",
      other_number: "",
      line: "-1",
      ring: "Resource:Ring1.wav",
      group_id_name: "All Contacts",
      eyepea_contact_id: "",
      original_number: originalNumber,
      wasFixed: normalizedNumber.wasFixed
    });
  });

  return {
    contacts,
    fixedCount,
    skippedCount
  };
}

function buildContactsXml(items) {
  const lines = [
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>",
    "<vp_contact>",
    "  <root_group>",
    "    <group display_name=\"All Contacts\" />",
    "    <group display_name=\"Blocklist\" />",
    "    <group display_name=\"All\" />",
    "  </root_group>",
    "  <root_contact>"
  ];

  items.forEach((item) => {
    lines.push(`    <contact display_name="${escapeXml(item.display_name)}" office_number="${escapeXml(item.office_number)}" mobile_number="${escapeXml(item.mobile_number)}" other_number="${escapeXml(item.other_number)}" line="${escapeXml(item.line)}" ring="${escapeXml(item.ring)}" group_id_name="${escapeXml(item.group_id_name)}" eyepea_contact_id="${escapeXml(item.eyepea_contact_id)}" />`);
  });

  lines.push("  </root_contact>");
  lines.push("</vp_contact>");

  return lines.join("\n");
}

async function loadContactsCsvFile(file) {
  const text = await file.text();
  const mapped = mapContactsCsvRows(text);

  if (mapped.contacts.length === 0) {
    throw new Error("No valid contacts were found in the CSV file.");
  }

  contactsSourceFileName = file.name;
  contactItems = mapped.contacts;
  contactFixedRows = mapped.fixedCount;
  contactSkippedRows = mapped.skippedCount;
  contactsFileName.textContent = file.name;
  setCounterText(contactsReadyCount, contactItems.length);
  setCounterText(contactsFixedCount, contactFixedRows);
  setCounterText(contactsSkippedCount, contactSkippedRows);
  renderContactPreview(contactItems);
}

function renderSearchResults(items) {
  searchResults.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "search-empty";
    empty.textContent = activeStatusFilter === "all"
      ? "No devices matched this search inside the main site."
      : `No devices matched the "${activeStatusFilter}" status filter.`;
    searchResults.append(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "search-row";
    const searchServerLabel = item.searchServerLabel || "-";
    const searchServerPortalUrl = getSearchServerPortalUrl(searchServerLabel);
    const searchServerMarkup = searchServerPortalUrl
      ? `<a class="search-cell-link" href="${searchServerPortalUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(searchServerLabel)}</a>`
      : escapeHtml(searchServerLabel);
    row.innerHTML = `
      <span class="search-cell search-cell-name">
        <small class="search-cell-label">Name/MAC</small>
        <strong>${escapeHtml(item.name || "-")}</strong>
        <small class="search-cell-subvalue">${escapeHtml(item.mac || "-")}</small>
      </span>
      <span class="search-cell">
        <small class="search-cell-label">Model</small>
        <span class="search-cell-value">${escapeHtml(item.model || "-")}</span>
      </span>
      <span class="search-cell search-cell-status">
        <small class="search-cell-label">Status <span class="status-indicator ${statusIndicatorClassName(item.status)}" aria-hidden="true"></span></small>
        <span class="search-status-value ${statusClassName(item.status)}">${escapeHtml(item.status || "-")}</span>
      </span>
      <span class="search-cell">
        <small class="search-cell-label">Account Status</small>
        <span class="search-cell-value">${escapeHtml(item.accountStatus || "-")}</span>
      </span>
      <span class="search-cell">
        <small class="search-cell-label">Firmware</small>
        <span class="search-cell-value">${escapeHtml(item.firmwareVersion || "-")}</span>
      </span>
      <span class="search-cell">
        <small class="search-cell-label">IP</small>
        <span class="search-cell-value">${escapeHtml([item.wanIp, item.lanIp].filter(Boolean).join(" / ") || "-")}</span>
      </span>
      <span class="search-cell">
        <small class="search-cell-label">Site</small>
        <span class="search-cell-value">${escapeHtml(item.siteName || "-")}</span>
      </span>
      <span class="search-cell">
        <small class="search-cell-label">Server</small>
        <span class="search-cell-value">${searchServerMarkup}</span>
      </span>
    `;
    searchResults.append(row);
  });
}

function getSearchTextFilteredItems() {
  const needle = String(searchFilterInput.value || "").trim().toUpperCase();

  if (!needle) {
    return searchResultItems.slice();
  }

  return searchResultItems.filter((item) => [
    item.name,
    item.model,
    item.status,
    item.accountStatus,
    item.siteName,
    item.mac,
    item.wanIp,
    item.lanIp
  ].some((value) => String(value || "").toUpperCase().includes(needle)));
}

function filterSearchItemsByStatus(items) {
  if (activeStatusFilter === "all") {
    return items;
  }

  return items.filter((item) => String(item.status || "").trim().toLowerCase() === activeStatusFilter);
}

function updateSearchCounters(items) {
  const counters = {
    total: items.length,
    online: 0,
    offline: 0,
    pending: 0,
    inactive: 0
  };

  for (const item of items) {
    const status = String(item.status || "").trim().toLowerCase();

    if (status === "online") {
      counters.online += 1;
    } else if (status === "offline") {
      counters.offline += 1;
    } else if (status === "pending") {
      counters.pending += 1;
    } else if (status === "inactive") {
      counters.inactive += 1;
    }
  }

  searchTotalCount.textContent = String(counters.total);
  searchOnlineCount.textContent = String(counters.online);
  searchOfflineCount.textContent = String(counters.offline);
  searchPendingCount.textContent = String(counters.pending);
  searchInactiveCount.textContent = String(counters.inactive);
  searchTotalCountInline.textContent = String(counters.total);
  searchOnlineCountInline.textContent = String(counters.online);
  searchOfflineCountInline.textContent = String(counters.offline);
  searchPendingCountInline.textContent = String(counters.pending);
  searchInactiveCountInline.textContent = String(counters.inactive);
}

function syncActiveStatusButtons() {
  statusFilterButtons.forEach((button) => {
    button.classList.toggle("status-filter-active", button.dataset.statusFilter === activeStatusFilter);
  });
}

function applySearchFilter() {
  const textFilteredItems = getSearchTextFilteredItems();
  const visibleItems = filterSearchItemsByStatus(textFilteredItems);
  updateSearchCounters(textFilteredItems);
  syncActiveStatusButtons();
  renderSearchResults(visibleItems);
}

async function refreshSearchData() {
  await runSearch(searchInput.value.trim());
}

function syncSearchAutoRefresh() {
  if (searchRefreshTimer) {
    window.clearInterval(searchRefreshTimer);
    searchRefreshTimer = null;
  }

  if (currentView !== "search") {
    return;
  }

  searchRefreshTimer = window.setInterval(() => {
    refreshSearchData().catch(() => {});
  }, 30000);
}

async function apiFetch(input, init) {
  const response = await fetch(input, init);

  if (response.status === 401) {
    applySessionUser(null);
    setAuthView("login");
    throw new Error("Your session expired. Please sign in again.");
  }

  return response;
}

async function loadModels(query = "") {
  if (modelItems.length === 0) {
    const response = await apiFetch("/api/models");
    const data = await response.json();
    modelItems = data.items || [];
    modelCount.textContent = String(data.total || modelItems.length);
    rerenderBatchRows();
  }

  const needle = normalizeCatalogText(query);
  filteredModelItems = needle
    ? modelItems.filter((item) => normalizeCatalogText(item.shortType).includes(needle))
    : modelItems;
  renderModels();
}

async function loadSites(query = "") {
  if (siteItems.length === 0) {
    const response = await apiFetch("/api/sites");
    const data = await response.json();
    siteItems = data.items || [];
    siteCount.textContent = String(data.total || siteItems.length);
    if (data.scope?.locked && !currentUser?.siteScope) {
      applySessionUser({
        ...(currentUser || {}),
        siteScope: data.scope
      });
    }
  }

  const needle = String(query || "").trim().toUpperCase();
  filteredSiteItems = needle
    ? siteItems.filter((item) => (
      item.name.toUpperCase().includes(needle) ||
      item.siteId.toUpperCase().includes(needle) ||
      item.parentName.toUpperCase().includes(needle)
    ))
    : siteItems;

  renderSites(siteMenu, siteInput, selectedSiteIdInput, (value) => {
    siteActiveIndex = value;
  });
  renderSites(batchSiteMenu, batchSiteInput, selectedBatchSiteIdInput, (value) => {
    batchSiteActiveIndex = value;
  });
  applyLockedSiteScopeToInputs();
}

async function runSearch(query = "") {
  const params = new URLSearchParams({ q: query });
  const response = await apiFetch(`/api/search?${params.toString()}`);
  const data = await response.json();
  searchResultItems = data.items || [];

  if (data.scope) {
    searchScope.textContent = isAdminUser()
      ? `Searching across ${data.searchedServers?.length || 0} YMCS servers`
      : `Searching inside ${data.scope.name}`;
    searchScopeTitle.textContent = data.scope.name;
    searchScopeDetails.textContent = data.scope.locked
      ? `This account can work only inside ${data.scope.name}.`
      : isAdminUser()
        ? "Results are merged automatically from all configured admin YMCS accounts."
        : "Click a status card to show only those devices.";
  } else {
    searchScopeDetails.textContent = "Search scope is currently unavailable.";
  }

  applySearchFilter();
}

function updateInputClearButton(input, button) {
  if (!input || !button) {
    return;
  }

  button.classList.toggle("hidden", String(input.value || "").trim() === "");
}

function bindClearableInput(input, button, onClear) {
  if (!input || !button) {
    return;
  }

  updateInputClearButton(input, button);
  input.addEventListener("input", () => {
    updateInputClearButton(input, button);
  });
  button.addEventListener("click", () => {
    input.value = "";
    updateInputClearButton(input, button);
    input.focus();
    onClear();
  });
}

function handleComboKeys(event, menu, state) {
  const options = Array.from(menu.querySelectorAll(".combo-option"));
  if (options.length === 0) {
    return null;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    return Math.min(state.activeIndex + 1, options.length - 1);
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    return Math.max(state.activeIndex - 1, 0);
  }

  if (event.key === "Enter" && state.activeIndex >= 0) {
    event.preventDefault();
    options[state.activeIndex].click();
    return state.activeIndex;
  }

  if (event.key === "Escape") {
    hideMenu(menu, state.input);
    return -1;
  }

  return null;
}

function setActiveOption(menu, activeIndex) {
  const options = Array.from(menu.querySelectorAll(".combo-option"));
  options.forEach((option, index) => {
    option.classList.toggle("combo-option-active", index === activeIndex);
  });
}

async function initializeApp() {
  if (appInitialized) {
    return;
  }

  appInitialized = true;
  initializeConfigurationTool();
  activateView("device");
  applyLockedSiteScopeToInputs();
  resetContactsGenerator();

  try {
    await Promise.all([
      loadModels(),
      loadSites(),
      runSearch("")
    ]);
  } catch (error) {
    setResponseState(
      responsePanel,
      responseBadge,
      responseMessage,
      false,
      error instanceof Error ? error.message : "Unable to load YMCS data."
    );
  } finally {
    if (!batchRows.children.length) {
      batchRows.append(createBatchRow());
      updateBatchReadyCount();
    }
  }
}

async function bootstrapSession() {
  try {
    const response = await fetch("/api/auth/session");
    const data = await response.json();

    if (data.authenticated) {
      applySessionUser(data.user);
      setAuthView("app");
      await initializeApp();
      return;
    }

    setAuthView("login");
  } catch (error) {
    setResponseState(
      loginResponse,
      loginResponseBadge,
      loginResponseMessage,
      false,
      error instanceof Error ? error.message : "Unable to check your session."
    );
    setAuthView("login");
  }
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => activateView(button.dataset.view));
});

quickAddButton.addEventListener("click", () => activateView("device"));

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    await fetch("/api/auth/logout", {
      method: "POST"
    });
  } finally {
    logoutButton.disabled = false;
    applySessionUser(null);
    resetAppState();
    resetResponseState(loginResponse, loginResponseMessage);
    loginForm.reset();
    setAuthView("login");
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginSubmitButton.disabled = true;
  loginSubmitButton.textContent = "Signing In...";

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: loginForm.elements.email.value.trim(),
        password: loginForm.elements.password.value
      })
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.message || "Sign in failed.");
    }

    applySessionUser(data.user);
    resetResponseState(loginResponse, loginResponseMessage);
    setAuthView("app");
    await initializeApp();
  } catch (error) {
    setResponseState(
      loginResponse,
      loginResponseBadge,
      loginResponseMessage,
      false,
      error instanceof Error ? error.message : "Sign in failed."
    );
  } finally {
    loginSubmitButton.disabled = false;
    loginSubmitButton.textContent = "Sign In";
  }
});

modelToggle.addEventListener("click", async () => {
  if (modelMenu.classList.contains("hidden")) {
    await loadModels(modelInput.value.trim());
    showMenu(modelMenu, modelInput);
    return;
  }

  hideMenu(modelMenu, modelInput);
  modelActiveIndex = -1;
});

siteToggle.addEventListener("click", async () => {
  if (isLockedSiteUser()) {
    return;
  }

  if (siteMenu.classList.contains("hidden")) {
    await loadSites(siteInput.value.trim());
    showMenu(siteMenu, siteInput);
    return;
  }

  hideMenu(siteMenu, siteInput);
  siteActiveIndex = -1;
});

batchSiteToggle.addEventListener("click", async () => {
  if (isLockedSiteUser()) {
    return;
  }

  if (batchSiteMenu.classList.contains("hidden")) {
    await loadSites(batchSiteInput.value.trim());
    showMenu(batchSiteMenu, batchSiteInput);
    return;
  }

  hideMenu(batchSiteMenu, batchSiteInput);
  batchSiteActiveIndex = -1;
});

modelInput.addEventListener("focus", async () => {
  await loadModels(modelInput.value.trim());
  showMenu(modelMenu, modelInput);
});

modelInput.addEventListener("input", async () => {
  selectedModelIdInput.value = "";
  await loadModels(modelInput.value.trim());
  showMenu(modelMenu, modelInput);
});

siteInput.addEventListener("focus", async () => {
  if (isLockedSiteUser()) {
    return;
  }

  await loadSites(siteInput.value.trim());
  showMenu(siteMenu, siteInput);
});

siteInput.addEventListener("input", async () => {
  if (isLockedSiteUser()) {
    return;
  }

  selectedSiteIdInput.value = "";
  await loadSites(siteInput.value.trim());
  showMenu(siteMenu, siteInput);
});

batchSiteInput.addEventListener("focus", async () => {
  if (isLockedSiteUser()) {
    return;
  }

  await loadSites(batchSiteInput.value.trim());
  showMenu(batchSiteMenu, batchSiteInput);
});

batchSiteInput.addEventListener("input", async () => {
  if (isLockedSiteUser()) {
    return;
  }

  selectedBatchSiteIdInput.value = "";
  await loadSites(batchSiteInput.value.trim());
  showMenu(batchSiteMenu, batchSiteInput);
});

modelInput.addEventListener("keydown", (event) => {
  const nextIndex = handleComboKeys(event, modelMenu, {
    activeIndex: modelActiveIndex,
    input: modelInput
  });

  if (nextIndex === null) {
    return;
  }

  modelActiveIndex = nextIndex;
  setActiveOption(modelMenu, modelActiveIndex);
});

siteInput.addEventListener("keydown", (event) => {
  if (isLockedSiteUser()) {
    return;
  }

  const nextIndex = handleComboKeys(event, siteMenu, {
    activeIndex: siteActiveIndex,
    input: siteInput
  });

  if (nextIndex === null) {
    return;
  }

  siteActiveIndex = nextIndex;
  setActiveOption(siteMenu, siteActiveIndex);
});

batchSiteInput.addEventListener("keydown", (event) => {
  if (isLockedSiteUser()) {
    return;
  }

  const nextIndex = handleComboKeys(event, batchSiteMenu, {
    activeIndex: batchSiteActiveIndex,
    input: batchSiteInput
  });

  if (nextIndex === null) {
    return;
  }

  batchSiteActiveIndex = nextIndex;
  setActiveOption(batchSiteMenu, batchSiteActiveIndex);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("#model-combo")) {
    hideMenu(modelMenu, modelInput);
    modelActiveIndex = -1;
  }

  if (!event.target.closest("#site-combo")) {
    hideMenu(siteMenu, siteInput);
    siteActiveIndex = -1;
  }

  if (!event.target.closest("#batch-site-combo")) {
    hideMenu(batchSiteMenu, batchSiteInput);
    batchSiteActiveIndex = -1;
  }
});

deviceForm.addEventListener("reset", () => {
  hideMenu(modelMenu, modelInput);
  hideMenu(siteMenu, siteInput);
  modelActiveIndex = -1;
  siteActiveIndex = -1;
  resetResponseState(responsePanel, responseMessage);
  selectedModelIdInput.value = "";
  if (isLockedSiteUser()) {
    applyLockedSiteScopeToInputs();
  } else {
    selectedSiteIdInput.value = "";
  }
});

deviceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  const payload = {
    name: deviceForm.elements.name.value.trim(),
    mac: deviceForm.elements.mac.value.trim(),
    sn: deviceForm.elements.sn.value.trim(),
    modelInput: selectedModelIdInput.value.trim() || deviceForm.elements.modelInput.value.trim(),
    siteId: selectedSiteIdInput.value.trim() || deviceForm.elements.siteInput.value.trim()
  };

  try {
    const response = await apiFetch("/api/devices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    const message = data.ok ? buildSuccessMessage(data) : (data.message || "Request failed.");
    setResponseState(responsePanel, responseBadge, responseMessage, Boolean(data.ok), message);
    if (data.ok) {
      await refreshSearchData();
    }
  } catch (error) {
    setResponseState(responsePanel, responseBadge, responseMessage, false, error instanceof Error ? error.message : "Unexpected request error");
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save";
  }
});

batchAddRowButton.addEventListener("click", () => {
  batchRows.append(createBatchRow());
  updateBatchReadyCount();
});

batchForm.addEventListener("reset", () => {
  resetBatchForm();
});

async function submitBatchForm() {
  const batchSiteId = getSelectedBatchSiteId();
  const devices = getBatchPayload();

  if (!batchSiteId) {
    setResponseState(batchResponsePanel, batchResponseBadge, batchResponseMessage, false, "Choose one site for the whole batch before saving.");
    return;
  }

  if (devices.length === 0) {
    setResponseState(batchResponsePanel, batchResponseBadge, batchResponseMessage, false, "Add at least one device row before saving.");
    return;
  }

  batchSaveButton.disabled = true;
  batchSaveButton.textContent = "Saving...";

  try {
    const response = await apiFetch("/api/devices/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ devices })
    });
    const data = await response.json();
    setResponseState(batchResponsePanel, batchResponseBadge, batchResponseMessage, Boolean(data.ok), data.message || "Batch request completed.");
    if (data.ok) {
      await refreshSearchData();
    }
  } catch (error) {
    setResponseState(batchResponsePanel, batchResponseBadge, batchResponseMessage, false, error instanceof Error ? error.message : "Unexpected request error");
  } finally {
    batchSaveButton.disabled = false;
    batchSaveButton.textContent = "Save";
  }
}

batchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitBatchForm();
});

batchSaveButton.addEventListener("click", async () => {
  await submitBatchForm();
});

batchTemplateButton.addEventListener("click", () => {
  const csv = [
    "name,mac,sn,model",
    "Reception,c4fc22000001,802017H120040001,W70B",
    "Office 2,c4fc22000002,802017H120040002,SIP-T54W"
  ].join("\n");
  downloadTextFile(csv, "ymcs-multiple-devices-template.csv", "text/csv;charset=utf-8");
});

batchUploadButton.addEventListener("click", () => {
  batchUploadInput.click();
});

batchUploadInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const importedRows = mapCsvRows(text);

    if (importedRows.length === 0) {
      throw new Error("The CSV file did not contain any device rows.");
    }

    batchRows.innerHTML = "";
    importedRows.forEach((item) => {
      batchRows.append(createBatchRow(item));
    });
    updateBatchReadyCount();
    setResponseState(batchResponsePanel, batchResponseBadge, batchResponseMessage, true, `${importedRows.length} rows loaded from CSV.`);
  } catch (error) {
    setResponseState(batchResponsePanel, batchResponseBadge, batchResponseMessage, false, error instanceof Error ? error.message : "CSV import failed.");
  } finally {
    batchUploadInput.value = "";
  }
});

contactsTemplateButton.addEventListener("click", () => {
  const csv = [
    "name,number",
    "Reception,050-123_4567",
    "Office 2,+972 54 987 6543"
  ].join("\n");
  downloadTextFile(csv, "yealink-contacts-template.csv", "text/csv;charset=utf-8");
});

contactsUploadButton.addEventListener("click", () => {
  contactsUploadInput.click();
});

contactsUploadInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    await loadContactsCsvFile(file);
    setResponseState(
      contactsResponsePanel,
      contactsResponseBadge,
      contactsResponseMessage,
      true,
      `${contactItems.length} contacts loaded. ${contactFixedRows} numbers were corrected and ${contactSkippedRows} rows were skipped.`
    );
  } catch (error) {
    resetContactsGenerator();
    setResponseState(
      contactsResponsePanel,
      contactsResponseBadge,
      contactsResponseMessage,
      false,
      error instanceof Error ? error.message : "CSV import failed."
    );
  } finally {
    contactsUploadInput.value = "";
  }
});

contactsGenerateButton.addEventListener("click", () => {
  if (contactItems.length === 0) {
    setResponseState(
      contactsResponsePanel,
      contactsResponseBadge,
      contactsResponseMessage,
      false,
      "Upload a CSV file before generating the XML contact list."
    );
    return;
  }

  contactsGenerateButton.disabled = true;
  contactsGenerateButton.textContent = "Generating...";

  try {
    const xmlContent = buildContactsXml(contactItems);
    const fileName = contactsSourceFileName
      ? `${contactsSourceFileName.replace(/\.[^.]+$/, "") || "contacts"}-yealink.xml`
      : "contacts-yealink.xml";

    downloadTextFile(xmlContent, fileName, "application/xml;charset=utf-8");
    setResponseState(
      contactsResponsePanel,
      contactsResponseBadge,
      contactsResponseMessage,
      true,
      `XML generated for ${contactItems.length} contacts. ${contactFixedRows} numbers were normalized before export.`
    );
  } catch (error) {
    setResponseState(
      contactsResponsePanel,
      contactsResponseBadge,
      contactsResponseMessage,
      false,
      error instanceof Error ? error.message : "XML generation failed."
    );
  } finally {
    contactsGenerateButton.disabled = false;
    contactsGenerateButton.textContent = "Generate XML";
  }
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch(searchInput.value.trim()).catch((error) => {
    searchResultItems = [];
    applySearchFilter();
    if (!(error instanceof Error && error.message === "Your session expired. Please sign in again.")) {
      searchScopeDetails.textContent = "Unable to load search results.";
    }
  });
});

searchFilterInput.addEventListener("input", () => {
  applySearchFilter();
});

searchFilterInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    applySearchFilter();
  }
});

statusFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeStatusFilter = button.dataset.statusFilter || "all";
    applySearchFilter();
  });
});

bindClearableInput(searchInput, searchClearButton, () => {
  searchForm.requestSubmit();
});
bindClearableInput(searchFilterInput, searchFilterClearButton, () => {
  applySearchFilter();
});

bootstrapSession();
