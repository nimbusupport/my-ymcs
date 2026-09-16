import {
  buildDomain,
  buildGeneratedConfig,
  buildTemplateConfig,
  createDownloadName,
  normalizeDomainPrefix,
  validateConfigInput
} from "./yealink-cfg.js";

const views = ["device", "multiple", "search", "accounts", "contacts", "configuration"];
const navButtons = Array.from(document.querySelectorAll("[data-view]"));
const workspaceTitle = document.querySelector("#workspace-title");
const quickAddButton = document.querySelector("#quick-add-button");
const logoutButton = document.querySelector("#logout-button");
const sessionUser = document.querySelector("#session-user");
const confirmModal = document.querySelector("#confirm-modal");
const confirmModalTitle = document.querySelector("#confirm-modal-title");
const confirmModalMessage = document.querySelector("#confirm-modal-message");
const confirmModalConfirmButton = document.querySelector("#confirm-modal-confirm");
const confirmModalCancelButton = document.querySelector("#confirm-modal-cancel");
const ipLookupModal = document.querySelector("#ip-lookup-modal");
const ipLookupModalTitle = document.querySelector("#ip-lookup-modal-title");
const ipLookupModalMessage = document.querySelector("#ip-lookup-modal-message");
const ipLookupModalContent = document.querySelector("#ip-lookup-modal-content");
const ipLookupModalCloseButton = document.querySelector("#ip-lookup-modal-close");
const sipAccountModal = document.querySelector("#sip-account-modal");
const sipAccountModalTitle = document.querySelector("#sip-account-modal-title");
const sipAccountModalMessage = document.querySelector("#sip-account-modal-message");
const sipAccountForm = document.querySelector("#sip-account-form");
const sipAccountSaveButton = document.querySelector("#sip-account-save-button");
const sipAccountCancelButton = document.querySelector("#sip-account-cancel-button");
const sipAccountResponsePanel = document.querySelector("#sip-account-response-panel");
const sipAccountResponseBadge = document.querySelector("#sip-account-response-badge");
const sipAccountResponseMessage = document.querySelector("#sip-account-response-message");
const sipBindOption = document.querySelector("#sip-bind-option");
const sipBindAfterSaveCheckbox = document.querySelector("#sip-bind-after-save");

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
const deviceAccountInput = document.querySelector("#device-account-input");
const selectedDeviceAccountIdInput = document.querySelector("#selected-device-account-id");
const deviceAccountMenu = document.querySelector("#device-account-menu");
const deviceAccountToggle = document.querySelector("#device-account-toggle");
const deviceAccountAddButton = document.querySelector("#device-account-add-button");
const deviceAccountNote = document.querySelector("#device-account-note");
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
const batchModelAutoInput = document.querySelector("#batch-model-auto-input");
const selectedBatchModelAutoIdInput = document.querySelector("#selected-batch-model-auto-id");
const batchModelAutoMenu = document.querySelector("#batch-model-auto-menu");
const batchModelAutoToggle = document.querySelector("#batch-model-auto-toggle");
const batchRowCountInput = document.querySelector("#batch-row-count");
const batchAddManyButton = document.querySelector("#batch-add-many");
const batchClearButton = document.querySelector("#batch-clear-button");

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const searchSubmitButton = document.querySelector("#search-button");
const searchClearButton = document.querySelector("#search-clear-button");
const searchFilterInput = document.querySelector("#search-filter-input");
const searchFilterClearButton = document.querySelector("#search-filter-clear-button");
const searchLoadingOverlay = document.querySelector("#search-loading-overlay");
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

const accountsSearchInput = document.querySelector("#accounts-search-input");
const accountsSearchClearButton = document.querySelector("#accounts-search-clear-button");
const accountsRefreshButton = document.querySelector("#accounts-refresh-button");
const accountsAddButton = document.querySelector("#accounts-add-button");
const accountsResults = document.querySelector("#accounts-results");
const accountsTotalCount = document.querySelector("#accounts-total-count");
const accountsResponsePanel = document.querySelector("#accounts-response-panel");
const accountsResponseBadge = document.querySelector("#accounts-response-badge");
const accountsResponseMessage = document.querySelector("#accounts-response-message");

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
const configCopyButton = document.querySelector("#config-copy-button");
const configStatusPill = document.querySelector("#config-status-pill");
const configResponsePanel = document.querySelector("#config-response-panel");
const configResponseBadge = document.querySelector("#config-response-badge");
const configResponseMessage = document.querySelector("#config-response-message");
const configGenerateButton = document.querySelector("#config-generate-button");
const configDownloadButton = document.querySelector("#config-download-button");
const configClearButton = document.querySelector("#config-clear-button");
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
const sipAccountSiteInput = document.querySelector("#sip-account-site-input");
const selectedSipAccountSiteIdInput = document.querySelector("#selected-sip-account-site-id");
const sipAccountSiteMenu = document.querySelector("#sip-account-site-menu");
const sipAccountSiteToggle = document.querySelector("#sip-account-site-toggle");
const sipAccountSiteNote = document.querySelector("#sip-account-site-note");
const MAX_BATCH_ROWS = 100;

let modelItems = [];
let siteItems = [];
let accountItems = [];
let filteredModelItems = [];
let filteredSiteItems = [];
let modelActiveIndex = -1;
let siteActiveIndex = -1;
let batchSiteActiveIndex = -1;
let batchModelAutoActiveIndex = -1;
let deviceAccountActiveIndex = -1;
let sipAccountSiteActiveIndex = -1;
let batchRowSequence = 0;
let searchResultItems = [];
let filteredAccountItems = [];
let activeStatusFilter = "all";
let appInitialized = false;
let batchAutoModelSelection = {
  displayValue: "",
  modelId: "",
  canonical: ""
};
let currentUser = null;
let currentView = "device";
let searchRefreshTimer = null;
let activeSearchRequestCount = 0;
let activeManualSearchRequestCount = 0;
let contactsSourceFileName = "";
let contactItems = [];
let contactFixedRows = 0;
let contactSkippedRows = 0;
let configurationToolInitialized = false;
let configurationDssExpanded = false;
let confirmModalResolver = null;
let confirmModalPreviousFocus = null;
let ipLookupModalPreviousFocus = null;
let sipAccountModalPreviousFocus = null;
let ipLookupRequestSequence = 0;
const ipLookupCache = new Map();
let sipAccountModalContext = {
  source: "accounts"
};

function setCounterText(element, value) {
  if (element) {
    element.textContent = String(value);
  }
}

function syncModalOpenState() {
  const confirmOpen = Boolean(confirmModal && !confirmModal.classList.contains("hidden"));
  const ipLookupOpen = Boolean(ipLookupModal && !ipLookupModal.classList.contains("hidden"));
  const sipAccountOpen = Boolean(sipAccountModal && !sipAccountModal.classList.contains("hidden"));
  document.body.classList.toggle("modal-open", confirmOpen || ipLookupOpen || sipAccountOpen);
}

function closeConfirmModal(confirmed) {
  if (!confirmModalResolver) {
    return;
  }

  const resolve = confirmModalResolver;
  confirmModalResolver = null;
  confirmModal.classList.add("hidden");
  confirmModal.setAttribute("aria-hidden", "true");
  syncModalOpenState();

  const previousFocus = confirmModalPreviousFocus;
  confirmModalPreviousFocus = null;
  if (previousFocus instanceof HTMLElement) {
    previousFocus.focus();
  }

  resolve(Boolean(confirmed));
}

function showConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel"
}) {
  if (!confirmModal || !confirmModalTitle || !confirmModalMessage || !confirmModalConfirmButton || !confirmModalCancelButton) {
    return Promise.resolve(window.confirm(message || title || "Are you sure?"));
  }

  if (confirmModalResolver) {
    closeConfirmModal(false);
  }

  confirmModalPreviousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  confirmModalTitle.textContent = title;
  confirmModalMessage.textContent = message;
  confirmModalConfirmButton.textContent = confirmLabel;
  confirmModalCancelButton.textContent = cancelLabel;
  confirmModal.classList.remove("hidden");
  confirmModal.setAttribute("aria-hidden", "false");
  syncModalOpenState();

  return new Promise((resolve) => {
    confirmModalResolver = resolve;
    window.requestAnimationFrame(() => {
      confirmModalConfirmButton.focus();
    });
  });
}

function closeIpLookupModal() {
  if (!ipLookupModal || ipLookupModal.classList.contains("hidden")) {
    return;
  }

  ipLookupModal.classList.add("hidden");
  ipLookupModal.setAttribute("aria-hidden", "true");
  syncModalOpenState();

  const previousFocus = ipLookupModalPreviousFocus;
  ipLookupModalPreviousFocus = null;
  if (previousFocus instanceof HTMLElement) {
    previousFocus.focus();
  }
}

function closeSipAccountModal(options = {}) {
  if (!sipAccountModal || sipAccountModal.classList.contains("hidden")) {
    return;
  }

  sipAccountModal.classList.add("hidden");
  sipAccountModal.setAttribute("aria-hidden", "true");
  syncModalOpenState();

  if (options.resetForm !== false) {
    sipAccountForm?.reset();
    if (selectedSipAccountSiteIdInput) {
      selectedSipAccountSiteIdInput.value = "";
    }
    resetResponseState(sipAccountResponsePanel, sipAccountResponseMessage);
  }

  const previousFocus = sipAccountModalPreviousFocus;
  sipAccountModalPreviousFocus = null;
  if (previousFocus instanceof HTMLElement) {
    previousFocus.focus();
  }
}

function formatIpLookupValue(value) {
  const normalized = String(value || "").trim();
  return normalized || "-";
}

function decodeUnicodeCodePoints(value) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "";
  }

  const matches = Array.from(normalized.matchAll(/U\+([0-9A-F]{2,6})/gi));
  if (matches.length === 0) {
    return "";
  }

  try {
    return matches
      .map((match) => String.fromCodePoint(Number.parseInt(match[1], 16)))
      .join("");
  } catch {
    return "";
  }
}

function isHttpUrl(value) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return false;
  }

  try {
    const url = new URL(normalized);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function renderIpLookupFieldValue(field) {
  const path = String(field?.path || "").trim();
  const label = String(field?.label || "").trim();
  const value = formatIpLookupValue(field?.value);
  const countryName = currentIpLookupCountryName || "Country";

  if (value === "-") {
    return escapeHtml(value);
  }

  if (path === "location.country_flag_emoji_unicode") {
    const flagIcon = decodeUnicodeCodePoints(value);
    if (flagIcon) {
      return `
        <span class="ip-lookup-flag-chip" title="${escapeHtml(value)}" aria-label="${escapeHtml(`${countryName} flag`)}">
          <span class="ip-lookup-flag-emoji" aria-hidden="true">${flagIcon}</span>
        </span>
      `;
    }
  }

  if (path === "location.country_flag" && isHttpUrl(value)) {
    return `
      <span class="ip-lookup-flag-chip">
        <img
          class="ip-lookup-flag-image"
          src="${escapeHtml(value)}"
          alt="${escapeHtml(`${countryName} flag`)}"
          loading="lazy"
          referrerpolicy="no-referrer"
        >
      </span>
    `;
  }

  if (label === "Location / Country Flag Emoji" && value.length <= 8) {
    return `
      <span class="ip-lookup-flag-chip" aria-label="${escapeHtml(`${countryName} flag`)}">
        <span class="ip-lookup-flag-emoji" aria-hidden="true">${escapeHtml(value)}</span>
      </span>
    `;
  }

  return escapeHtml(value);
}

let currentIpLookupCountryName = "";

function renderIpLookupModalState({ title, message, summaryItems = [], fields = [] }) {
  if (!ipLookupModalTitle || !ipLookupModalMessage || !ipLookupModalContent) {
    return;
  }

  ipLookupModalTitle.textContent = title;
  ipLookupModalMessage.textContent = message;
  const currentCountryName = fields.find((field) => field?.path === "country_name")?.value
    || fields.find((field) => field?.path === "country")?.value
    || summaryItems.find((item) => item?.label === "Country")?.value
    || "";
  currentIpLookupCountryName = String(currentCountryName || "").trim();

  const summaryMarkup = summaryItems.length > 0
    ? `
      <section class="ip-lookup-summary-grid">
        ${summaryItems.map((item) => `
          <article class="ip-lookup-summary-card">
            <span class="ip-lookup-summary-label">${escapeHtml(item.label)}</span>
            <strong class="ip-lookup-summary-value">${escapeHtml(formatIpLookupValue(item.value))}</strong>
          </article>
        `).join("")}
      </section>
    `
    : "";

  const fieldsMarkup = fields.length > 0
    ? `
      <section class="ip-lookup-fields-grid">
        ${fields.map((field) => `
          <article class="ip-lookup-field-card">
            <span class="ip-lookup-field-label">${escapeHtml(field.label || field.path || "Field")}</span>
            <strong class="ip-lookup-field-value">${renderIpLookupFieldValue(field)}</strong>
          </article>
        `).join("")}
      </section>
    `
    : `<div class="ip-lookup-empty">No IP metadata is available for this address.</div>`;

  ipLookupModalContent.innerHTML = `${summaryMarkup}${fieldsMarkup}`;
}

function openIpLookupModal(ipAddress, triggerElement = null) {
  if (!ipLookupModal || !ipLookupModalTitle || !ipLookupModalMessage || !ipLookupModalContent) {
    return;
  }

  const normalizedIp = String(ipAddress || "").trim();
  if (!normalizedIp) {
    return;
  }

  ipLookupModalPreviousFocus = triggerElement instanceof HTMLElement
    ? triggerElement
    : document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

  ipLookupModal.classList.remove("hidden");
  ipLookupModal.setAttribute("aria-hidden", "false");
  syncModalOpenState();
  renderIpLookupModalState({
    title: normalizedIp,
    message: "Checking ISP, location, and network details for this IP address.",
    fields: [{
      label: "Status",
      value: "Loading..."
    }]
  });
  window.requestAnimationFrame(() => {
    ipLookupModalCloseButton?.focus();
  });

  if (ipLookupCache.has(normalizedIp)) {
    const cached = ipLookupCache.get(normalizedIp);
    renderIpLookupModalState(cached);
    return;
  }

  const requestId = ++ipLookupRequestSequence;
  apiFetch(`/api/ip-lookup?ip=${encodeURIComponent(normalizedIp)}`)
    .then(async (response) => {
      const data = await response.json();

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.message || "IP lookup failed.");
      }

      const summaryItems = [
        { label: "ISP", value: data.isp },
        { label: "Organization", value: data.organization },
        { label: "Carrier", value: data.carrier },
        { label: "Connection Type", value: data.connectionType },
        { label: "Hostname", value: data.hostname },
        { label: "Country", value: data.countryName },
        { label: "Region", value: data.regionName },
        { label: "City", value: data.city }
      ].filter((item) => String(item.value || "").trim());

      const viewModel = {
        title: data.ip || normalizedIp,
        message: data.isp
          ? `ISP detected: ${data.isp}`
          : "Lookup completed. Some ISP fields were not returned by the provider.",
        summaryItems,
        fields: Array.isArray(data.fields) ? data.fields : []
      };

      ipLookupCache.set(normalizedIp, viewModel);
      if (requestId === ipLookupRequestSequence && ipLookupModal && !ipLookupModal.classList.contains("hidden")) {
        renderIpLookupModalState(viewModel);
      }
    })
    .catch((error) => {
      if (requestId !== ipLookupRequestSequence || !ipLookupModal || ipLookupModal.classList.contains("hidden")) {
        return;
      }

      renderIpLookupModalState({
        title: normalizedIp,
        message: error instanceof Error ? error.message : "IP lookup failed.",
        fields: []
      });
    });
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

function setConfigurationCopyState(enabled) {
  configCopyButton.disabled = !enabled;
  configCopyButton.title = enabled ? "Copy cfg preview" : "Generate a cfg preview first";
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
    setConfigurationCopyState(false);
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
  setConfigurationCopyState(true);
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
  setConfigurationCopyState(false);
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

  configClearButton.addEventListener("click", () => {
    resetConfigurationTool();
    setResponseState(
      configResponsePanel,
      configResponseBadge,
      configResponseMessage,
      true,
      "Configuration inputs cleared."
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

  configCopyButton.addEventListener("click", async () => {
    const previewText = configPreview.textContent.trim();

    if (!previewText || configCopyButton.disabled) {
      return;
    }

    try {
      await navigator.clipboard.writeText(previewText);
      setResponseState(
        configResponsePanel,
        configResponseBadge,
        configResponseMessage,
        true,
        "CFG preview copied to clipboard."
      );
    } catch (error) {
      setResponseState(
        configResponsePanel,
        configResponseBadge,
        configResponseMessage,
        false,
        "Unable to copy the cfg preview."
      );
    }
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
  accountItems = [];
  filteredModelItems = [];
  filteredSiteItems = [];
  filteredAccountItems = [];
  modelActiveIndex = -1;
  siteActiveIndex = -1;
  batchSiteActiveIndex = -1;
  deviceAccountActiveIndex = -1;
  sipAccountSiteActiveIndex = -1;
  batchRowSequence = 0;
  searchResultItems = [];
  activeStatusFilter = "all";
  appInitialized = false;
  currentView = "device";

  if (searchRefreshTimer) {
    window.clearInterval(searchRefreshTimer);
    searchRefreshTimer = null;
  }

  activeSearchRequestCount = 0;
  activeManualSearchRequestCount = 0;
  setSearchLoadingState(false);

  hideMenu(modelMenu, modelInput);
  hideMenu(siteMenu, siteInput);
  hideMenu(batchSiteMenu, batchSiteInput);
  hideMenu(deviceAccountMenu, deviceAccountInput);
  hideMenu(sipAccountSiteMenu, sipAccountSiteInput);
  closeSipAccountModal();

  deviceForm.reset();
  resetBatchForm();
  resetSipAccountForm();
  setSelectedDeviceAccount(null);

  selectedModelIdInput.value = "";
  selectedSiteIdInput.value = "";
  selectedBatchSiteIdInput.value = "";
  selectedDeviceAccountIdInput.value = "";
  selectedSipAccountSiteIdInput.value = "";
  searchInput.value = "";
  searchFilterInput.value = "";
  accountsSearchInput.value = "";
  searchResults.innerHTML = "";
  accountsResults.innerHTML = "";
  searchScope.textContent = "Searching inside NIMBUSIP";
  searchScopeTitle.textContent = "NIMBUSIP";
  searchScopeDetails.textContent = "Loading site scope from YMCS...";
  modelCount.textContent = "0";
  siteCount.textContent = "0";
  setCounterText(accountsTotalCount, 0);
  resetSearchCounters();
  resetContactsGenerator();
  resetConfigurationTool();
  resetResponseState(responsePanel, responseMessage);
  resetResponseState(batchResponsePanel, batchResponseMessage);
  resetResponseState(accountsResponsePanel, accountsResponseMessage);
  updateInputClearButton(searchInput, searchClearButton);
  updateInputClearButton(searchFilterInput, searchFilterClearButton);
  updateInputClearButton(accountsSearchInput, accountsSearchClearButton);
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

function setSearchLoadingState(isLoading, { showOverlay = false } = {}) {
  if (showOverlay) {
    searchLoadingOverlay.classList.toggle("hidden", !isLoading);
    searchLoadingOverlay.setAttribute("aria-hidden", String(!isLoading));
  } else if (!isLoading && activeSearchRequestCount === 0) {
    searchLoadingOverlay.classList.add("hidden");
    searchLoadingOverlay.setAttribute("aria-hidden", "true");
  }

  const isManualLoading = activeManualSearchRequestCount > 0;
  searchSubmitButton.disabled = isManualLoading;
  searchSubmitButton.textContent = isManualLoading ? "Searching..." : "AI search";
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
  setSiteControlState(sipAccountSiteInput, selectedSipAccountSiteIdInput, sipAccountSiteToggle, sipAccountSiteNote, lockedSite);

  if (!lockedSite) {
    if (deviceSiteNote) {
      deviceSiteNote.innerHTML = "Choose a YMCS site by name, or paste a raw site ID such as <code>u4encsac</code>.";
    }

    if (batchSiteNote) {
      batchSiteNote.textContent = "Every imported or manual row in this batch will be added to the selected site.";
    }

    if (sipAccountSiteNote) {
      sipAccountSiteNote.textContent = "Optional. You can assign this account to a YMCS site.";
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
      : view === "accounts"
        ? "SIP Accounts"
      : view === "contacts"
        ? "Contacts Generate"
        : view === "configuration"
          ? "Configuration"
          : "NIMBUSIP";
  quickAddButton.classList.toggle("hidden", view === "contacts" || view === "configuration");

  syncSearchAutoRefresh();
  if (view === "accounts") {
    void loadAccounts().catch((error) => {
      setResponseState(
        accountsResponsePanel,
        accountsResponseBadge,
        accountsResponseMessage,
        false,
        error instanceof Error ? error.message : "Unable to load SIP accounts."
      );
    });
  }
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

function hasUtf8Bom(bytes) {
  return bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
}

function hasUtf16LeBom(bytes) {
  return bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe;
}

function hasUtf16BeBom(bytes) {
  return bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff;
}

function decodeBytes(bytes, encoding, useFatal = false) {
  return new TextDecoder(encoding, { fatal: useFatal }).decode(bytes);
}

function decodeCsvBytes(bytes) {
  if (hasUtf8Bom(bytes)) {
    return decodeBytes(bytes, "utf-8");
  }

  if (hasUtf16LeBom(bytes)) {
    return decodeBytes(bytes, "utf-16le");
  }

  if (hasUtf16BeBom(bytes)) {
    return decodeBytes(bytes, "utf-16be");
  }

  try {
    return decodeBytes(bytes, "utf-8", true);
  } catch (utf8Error) {
    try {
      return decodeBytes(bytes, "windows-1255");
    } catch (windows1255Error) {
      try {
        return decodeBytes(bytes, "iso-8859-8");
      } catch (iso88598Error) {
        return decodeBytes(bytes, "utf-8");
      }
    }
  }
}

async function readCsvFileText(file) {
  const buffer = await file.arrayBuffer();
  return decodeCsvBytes(new Uint8Array(buffer));
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
      label: item.parentName
        ? `${item.name} - ${item.parentName}`
        : item.name
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

function getFilteredAccountItems(query = "") {
  const needle = normalizeCatalogText(query);

  if (!needle) {
    return accountItems.slice();
  }

  return accountItems.filter((item) => [
    item.username,
    item.registerName,
    item.serverAddress,
    item.remark,
    item.siteName,
    item.siteParentName,
    item.id
  ].some((value) => normalizeCatalogText(value).includes(needle)));
}

function getAccountDisplayValue(item) {
  if (!item) {
    return "";
  }

  const username = String(item.username || "").trim();
  const serverAddress = String(item.serverAddress || "").trim();
  return serverAddress ? `${username} - ${serverAddress}` : username;
}

function getAccountSiteDisplayValue(item) {
  if (!item) {
    return "-";
  }

  return item.siteParentName
    ? `${item.siteName || "-"} - ${item.siteParentName}`
    : (item.siteName || "-");
}

function formatAccountType(value) {
  switch (Number(value)) {
    case 1:
      return "H323";
    case 2:
      return "SFB";
    case 0:
    default:
      return "SIP";
  }
}

function formatTimestamp(value) {
  const timestamp = Number(value);
  if (!timestamp) {
    return "-";
  }

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function renderDeviceAccountMenu(query = "") {
  if (!deviceAccountMenu || !deviceAccountInput || !selectedDeviceAccountIdInput) {
    return;
  }

  const items = getFilteredAccountItems(query);
  filteredAccountItems = items;
  renderComboMenu(
    deviceAccountMenu,
    items.map((item) => ({
      ...item,
      label: getAccountDisplayValue(item)
    })),
    "No matching SIP account. Use + SIP Account to create one.",
    (item) => {
      setSelectedDeviceAccount(item);
      hideMenu(deviceAccountMenu, deviceAccountInput);
      deviceAccountActiveIndex = -1;
    }
  );

  deviceAccountActiveIndex = normalizeCatalogText(query) && items.length > 0 ? 0 : -1;
  setActiveOption(deviceAccountMenu, deviceAccountActiveIndex);
}

function renderAccountsResults(items) {
  accountsResults.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "search-empty";
    empty.textContent = "No SIP accounts matched this search.";
    accountsResults.append(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "accounts-row";
    row.innerHTML = `
      <span class="account-cell">
        <small class="account-cell-label">Username</small>
        <strong class="account-cell-value">${escapeHtml(item.username || "-")}</strong>
      </span>
      <span class="account-cell">
        <small class="account-cell-label">Register Name</small>
        <span class="account-cell-value">${escapeHtml(item.registerName || "-")}</span>
      </span>
      <span class="account-cell">
        <small class="account-cell-label">Server</small>
        <span class="account-cell-value">${escapeHtml(item.serverAddress || "-")}</span>
      </span>
      <span class="account-cell">
        <small class="account-cell-label">Type</small>
        <span class="account-type-pill">${escapeHtml(formatAccountType(item.accountType))}</span>
      </span>
      <span class="account-cell">
        <small class="account-cell-label">Site</small>
        <span class="account-cell-value">${escapeHtml(getAccountSiteDisplayValue(item))}</span>
      </span>
      <span class="account-cell">
        <small class="account-cell-label">Created</small>
        <span class="account-cell-value">${escapeHtml(formatTimestamp(item.createTime))}</span>
      </span>
    `;
    accountsResults.append(row);
  });
}

function applyAccountsFilter() {
  const query = accountsSearchInput?.value.trim() || "";
  const items = getFilteredAccountItems(query);
  renderAccountsResults(items);
}

function findSiteItemById(siteId) {
  const normalizedId = String(siteId || "").trim();
  return siteItems.find((item) => item.siteId === normalizedId) || null;
}

function setSipAccountSiteSelection(siteId = "") {
  const normalizedId = String(siteId || "").trim();
  const matched = findSiteItemById(normalizedId);
  selectedSipAccountSiteIdInput.value = normalizedId;
  sipAccountSiteInput.value = matched ? matched.name : normalizedId;
}

function setSelectedDeviceAccount(item = null) {
  if (!deviceAccountInput || !selectedDeviceAccountIdInput) {
    return;
  }

  if (!item) {
    deviceAccountInput.value = "";
    selectedDeviceAccountIdInput.value = "";
    if (deviceAccountNote) {
      deviceAccountNote.innerHTML = "Optional. The selected SIP account will bind to line <code>1</code> after the device is created.";
    }
    return;
  }

  deviceAccountInput.value = getAccountDisplayValue(item);
  selectedDeviceAccountIdInput.value = item.id || "";
  if (deviceAccountNote) {
    deviceAccountNote.innerHTML = `Selected account <code>${escapeHtml(item.username || item.id || "")}</code> will bind to line <code>1</code> after the device is created.`;
  }
}

function resetSipAccountForm() {
  sipAccountForm?.reset();
  resetResponseState(sipAccountResponsePanel, sipAccountResponseMessage);
  selectedSipAccountSiteIdInput.value = "";
  sipAccountSiteInput.value = "";
  sipAccountSiteActiveIndex = -1;
}

function openSipAccountModal(context = {}) {
  sipAccountModalContext = {
    source: context.source || "accounts"
  };
  sipAccountModalPreviousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  resetSipAccountForm();

  const currentSiteId = String(context.siteId || "").trim()
    || selectedSiteIdInput.value.trim();

  if (currentSiteId) {
    setSipAccountSiteSelection(currentSiteId);
  }

  const bindOptionVisible = context.source === "device";
  sipBindOption.classList.toggle("hidden", !bindOptionVisible);
  sipBindAfterSaveCheckbox.checked = bindOptionVisible;
  sipAccountModalTitle.textContent = bindOptionVisible ? "Add SIP Account For Device" : "Add SIP Account";
  sipAccountModalMessage.textContent = bindOptionVisible
    ? "Create a SIP account in YMCS. If you keep binding enabled, it will be attached to the device after you save that device."
    : "Create a SIP account directly in YMCS and keep it ready for later device binding.";
  sipAccountModal.classList.remove("hidden");
  sipAccountModal.setAttribute("aria-hidden", "false");
  syncModalOpenState();
  window.requestAnimationFrame(() => {
    sipAccountForm?.elements?.registerName?.focus?.();
  });
}

function mergeAccountItem(item) {
  const nextItems = [item, ...accountItems.filter((entry) => entry.id !== item.id)];
  accountItems = nextItems;
  filteredAccountItems = getFilteredAccountItems(deviceAccountInput?.value.trim() || "");
  setCounterText(accountsTotalCount, accountItems.length);
  applyAccountsFilter();
  renderDeviceAccountMenu(deviceAccountInput?.value.trim() || "");
}

function buildSipAccountPayload() {
  return {
    registerName: sipAccountForm.elements.registerName.value.trim(),
    username: sipAccountForm.elements.username.value.trim(),
    password: sipAccountForm.elements.password.value.trim(),
    label: sipAccountForm.elements.label.value.trim(),
    displayName: sipAccountForm.elements.displayName.value.trim(),
    remark: sipAccountForm.elements.remark.value.trim(),
    siteId: selectedSipAccountSiteIdInput.value.trim() || sipAccountSiteInput.value.trim(),
    sipServer1: {
      host: sipAccountForm.elements.sipServer1Host.value.trim(),
      port: sipAccountForm.elements.sipServer1Port.value.trim()
    },
    sipServer2: {
      host: sipAccountForm.elements.sipServer2Host.value.trim(),
      port: sipAccountForm.elements.sipServer2Port.value.trim()
    }
  };
}

function normalizeCreatedAccount(payload, requestBody) {
  const siteId = String(requestBody?.siteId ?? "").trim();
  const site = findSiteItemById(siteId);
  return {
    id: String(payload?.id || "").trim(),
    username: String(payload?.username || requestBody?.username || "").trim(),
    registerName: String(payload?.registerName || payload?.registerInfo || requestBody?.registerName || "").trim(),
    serverAddress: String(payload?.serverAddress || requestBody?.sipServer1?.host || "").trim(),
    accountType: Number(payload?.accountType ?? 0),
    remark: String(payload?.remark || requestBody?.remark || "").trim(),
    createTime: Number(payload?.createTime ?? Date.now()),
    siteId,
    siteName: site?.name || String(payload?.siteName || "").trim(),
    siteParentName: site?.parentName || String(payload?.siteParentName || "").trim()
  };
}

function findModelItem(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return null;
  }

  const normalizedValue = normalizeCatalogText(trimmed);
  const upperValue = trimmed.toUpperCase();
  return modelItems.find((item) => (
    String(item.modelId || "").trim().toUpperCase() === upperValue ||
    normalizeCatalogText(item.shortType) === normalizedValue
  )) || null;
}

function getFilteredModelCatalogItems(query = "") {
  const needle = normalizeCatalogText(query);

  if (!needle) {
    return modelItems.slice();
  }

  return modelItems
    .filter((item) => {
      const shortTypeKey = normalizeCatalogText(item.shortType);
      const modelIdKey = String(item.modelId || "").trim().toUpperCase();
      return shortTypeKey.includes(needle) || modelIdKey.includes(needle);
    })
    .sort((left, right) => {
      const getScore = (item) => {
        const shortTypeKey = normalizeCatalogText(item.shortType);
        const modelIdKey = String(item.modelId || "").trim().toUpperCase();

        if (shortTypeKey === needle) {
          return 0;
        }

        if (modelIdKey === needle) {
          return 1;
        }

        if (shortTypeKey.startsWith(needle)) {
          return 2;
        }

        if (shortTypeKey.includes(needle)) {
          return 3;
        }

        if (modelIdKey.startsWith(needle)) {
          return 4;
        }

        return 5;
      };

      const scoreDifference = getScore(left) - getScore(right);
      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      const lengthDifference = String(left.shortType || "").length - String(right.shortType || "").length;
      if (lengthDifference !== 0) {
        return lengthDifference;
      }

      return String(left.shortType || "").localeCompare(String(right.shortType || ""));
    });
}

function findModelOption(value) {
  if (!value) {
    return "";
  }

  const matched = findModelItem(value);
  return matched ? matched.modelId : value;
}

function getModelDisplayValue(value) {
  const matched = findModelItem(value);
  return matched ? matched.shortType : String(value || "");
}

function resolveBatchModelValue(value) {
  const exactMatch = findModelItem(value);
  if (exactMatch) {
    return exactMatch.modelId || String(value || "").trim();
  }

  const filteredItems = getFilteredModelCatalogItems(value);
  if (filteredItems.length === 1) {
    return filteredItems[0].modelId || String(value || "").trim();
  }

  return String(value || "").trim();
}

function buildBatchModelSelection(displayValue = "", modelIdValue = "") {
  const typedValue = String(displayValue || "").trim();
  const hiddenValue = String(modelIdValue || "").trim();
  const resolvedValue = hiddenValue || (typedValue ? resolveBatchModelValue(typedValue) : "");
  const nextDisplayValue = typedValue || getModelDisplayValue(resolvedValue);
  return {
    displayValue: nextDisplayValue,
    modelId: resolvedValue,
    canonical: normalizeCatalogText(resolvedValue || nextDisplayValue)
  };
}

function getBatchAutoModelSelection() {
  return buildBatchModelSelection(
    batchModelAutoInput?.value,
    selectedBatchModelAutoIdInput?.value
  );
}

function setBatchAutoModelSelection(selection = {}) {
  const nextSelection = buildBatchModelSelection(selection.displayValue, selection.modelId);
  batchAutoModelSelection = nextSelection;
  if (batchModelAutoInput) {
    batchModelAutoInput.value = nextSelection.displayValue;
  }
  if (selectedBatchModelAutoIdInput) {
    selectedBatchModelAutoIdInput.value = nextSelection.modelId;
  }
  return nextSelection;
}

function buildSuccessMessage(payload) {
  if (payload?.message && payload?.bindResult) {
    return payload.message;
  }

  const model = modelInput.value.trim() || payload?.requestBody?.modelId || "Unknown model";
  const mac = payload?.payload?.mac || payload?.requestBody?.mac || deviceForm.elements.mac.value.trim();
  return `Device "${model}"  Mac: "${mac}"  Device created successfully.`;
}

function normalizeBatchMac(value) {
  return String(value ?? "").replace(/[^a-fA-F0-9]/g, "").toLowerCase();
}

function getBatchRowInputs(row) {
  return {
    name: row.querySelector("[name='name']"),
    mac: row.querySelector("[name='mac']"),
    sn: row.querySelector("[name='sn']"),
    model: row.querySelector("[data-batch-model-input]"),
    modelId: row.querySelector("[name='modelId']")
  };
}

function getBatchRowCount() {
  return batchRows.querySelectorAll(".batch-row").length;
}

function isSingleEmptyBatchRow() {
  const rows = Array.from(batchRows.querySelectorAll(".batch-row"));
  return rows.length === 1 && !hasBatchRowContent(rows[0]);
}

function getBatchRowModelSelection(row) {
  const inputs = getBatchRowInputs(row);
  return buildBatchModelSelection(inputs.model?.value, inputs.modelId?.value);
}

function applyModelSelectionToBatchRow(row, selection) {
  if (!row) {
    return;
  }

  const nextSelection = buildBatchModelSelection(selection.displayValue, selection.modelId);
  if (!nextSelection.displayValue && !nextSelection.modelId) {
    return;
  }

  const inputs = getBatchRowInputs(row);
  if (inputs.model) {
    inputs.model.value = nextSelection.displayValue;
  }
  if (inputs.modelId) {
    inputs.modelId.value = nextSelection.modelId;
  }
  hideBatchModelMenu(row);
  syncBatchRowValidation(row);
}

function hasBatchRowContent(row) {
  const inputs = getBatchRowInputs(row);
  return Boolean(
    inputs.name?.value.trim()
    || inputs.mac?.value.trim()
    || inputs.sn?.value.trim()
    || inputs.model?.value.trim()
    || inputs.modelId?.value.trim()
  );
}

function setBatchInputValidity(input, isInvalid) {
  if (!input) {
    return;
  }

  void isInvalid;
  input.classList.remove("batch-field-invalid");
  input.removeAttribute("aria-invalid");
}

function clearBatchRowValidation(row) {
  row.classList.remove("batch-row-invalid");
  const inputs = getBatchRowInputs(row);
  setBatchInputValidity(inputs.mac, false);
  setBatchInputValidity(inputs.sn, false);
}

function syncBatchRowValidation(row) {
  if (!row) {
    return { hasContent: false, valid: true };
  }

  const inputs = getBatchRowInputs(row);
  const hasContent = hasBatchRowContent(row);

  if (!hasContent) {
    clearBatchRowValidation(row);
    return { hasContent: false, valid: true };
  }

  const normalizedMac = normalizeBatchMac(inputs.mac?.value);
  const serialValue = inputs.sn?.value.trim() || "";
  const macInvalid = normalizedMac.length < 12 || normalizedMac.length > 17;
  const snInvalid = !serialValue || serialValue.length > 128;
  const invalid = macInvalid || snInvalid;

  row.classList.toggle("batch-row-invalid", invalid);
  setBatchInputValidity(inputs.mac, macInvalid);
  setBatchInputValidity(inputs.sn, snInvalid);

  return {
    hasContent,
    valid: !invalid,
    macInvalid,
    snInvalid
  };
}

function validateBatchRows() {
  const invalidRows = [];
  let populatedRowCount = 0;

  Array.from(batchRows.querySelectorAll(".batch-row")).forEach((row, index) => {
    const validation = syncBatchRowValidation(row);
    if (validation.hasContent) {
      populatedRowCount += 1;
    }

    if (!validation.valid) {
      invalidRows.push(index + 1);
    }
  });

  return {
    populatedRowCount,
    invalidRows
  };
}

function syncBatchAutoModelToRows(previousSelection = batchAutoModelSelection, nextSelection = getBatchAutoModelSelection()) {
  if (!nextSelection.canonical) {
    batchAutoModelSelection = nextSelection;
    return;
  }

  batchRows.querySelectorAll(".batch-row").forEach((row) => {
    const currentSelection = getBatchRowModelSelection(row);
    const shouldSync = !currentSelection.canonical
      || (previousSelection.canonical && currentSelection.canonical === previousSelection.canonical);

    if (shouldSync) {
      applyModelSelectionToBatchRow(row, nextSelection);
    }
  });

  batchAutoModelSelection = nextSelection;
  updateBatchReadyCount();
}

function clampBatchRowRequest(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(Math.max(parsed, 1), MAX_BATCH_ROWS);
}

function syncBatchRowCountInput() {
  if (!batchRowCountInput) {
    return 1;
  }

  const nextValue = clampBatchRowRequest(batchRowCountInput.value);
  batchRowCountInput.value = String(nextValue);
  return nextValue;
}

function addBatchRows(count, options = {}) {
  let rowsToAdd = clampBatchRowRequest(count);
  const reuseBlankRow = options.reuseBlankRow !== false;
  const createdRows = [];

  if (reuseBlankRow && rowsToAdd > 0 && isSingleEmptyBatchRow()) {
    const firstRow = batchRows.querySelector(".batch-row");
    if (firstRow && batchAutoModelSelection.canonical && !getBatchRowModelSelection(firstRow).canonical) {
      applyModelSelectionToBatchRow(firstRow, batchAutoModelSelection);
    }
    rowsToAdd -= 1;
  }

  const remainingCapacity = Math.max(MAX_BATCH_ROWS - getBatchRowCount(), 0);
  const rowsWithinLimit = Math.min(rowsToAdd, remainingCapacity);

  for (let index = 0; index < rowsWithinLimit; index += 1) {
    const row = createBatchRow();
    batchRows.append(row);
    createdRows.push(row);
  }

  updateBatchReadyCount();
  return {
    createdRows,
    rowsAdded: rowsWithinLimit,
    limitReached: rowsWithinLimit < rowsToAdd
  };
}

function focusBatchInput(input) {
  if (!input) {
    return;
  }

  input.focus();
  if (typeof input.select === "function") {
    input.select();
  }
}

function focusNextBatchMacInput(row) {
  const rows = Array.from(batchRows.querySelectorAll(".batch-row"));
  const currentIndex = rows.indexOf(row);
  if (currentIndex === -1) {
    return;
  }

  let nextRow = rows[currentIndex + 1];
  if (!nextRow) {
    const { createdRows } = addBatchRows(1, { reuseBlankRow: false });
    nextRow = createdRows[0] || null;
  }

  const nextMacInput = nextRow?.querySelector("[name='mac']");
  focusBatchInput(nextMacInput);
}

function rebuildBatchRows(items = [], options = {}) {
  const highlightIndexes = new Set(Array.isArray(options.highlightIndexes) ? options.highlightIndexes : []);
  batchRows.innerHTML = "";

  const nextRows = items.length > 0 ? items : [{}];
  nextRows.forEach((item, index) => {
    const row = createBatchRow({
      name: item.name,
      mac: item.mac,
      sn: item.sn,
      modelId: item.modelInput || item.modelId
    });
    if (highlightIndexes.has(index)) {
      row.classList.add("batch-row-invalid");
    }
    batchRows.append(row);
  });

  updateBatchReadyCount();
}

function keepOnlyFailedBatchRows(submittedDevices, failedRows) {
  const failedIndexes = Array.from(new Set(
    (Array.isArray(failedRows) ? failedRows : [])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 0 && value < submittedDevices.length)
  ));

  if (failedIndexes.length === 0) {
    return false;
  }

  rebuildBatchRows(
    failedIndexes.map((index) => submittedDevices[index]),
    { highlightIndexes: failedIndexes.map((_, index) => index) }
  );
  return true;
}

function getBatchSuccessCount(payload) {
  return Number(payload?.payload?.successCount ?? 0);
}

function createBatchRow(initialValues = {}) {
  batchRowSequence += 1;
  const row = document.createElement("div");
  row.className = "batch-row";
  row.dataset.rowId = String(batchRowSequence);
  const initialModelValue = initialValues.modelInput || initialValues.modelId || "";

  row.innerHTML = `
    <div class="batch-row-grid">
      <input type="text" name="name" placeholder="Device name" value="${escapeHtml(initialValues.name || "")}">
      <input type="text" name="mac" placeholder="MAC" value="${escapeHtml(initialValues.mac || "")}">
      <input type="text" name="sn" placeholder="Serial number" value="${escapeHtml(initialValues.sn || "")}">
      <div class="combo batch-model-combo">
        <div class="combo-shell">
          <input
            type="text"
            name="batchModelInput"
            data-batch-model-input
            placeholder="Type model name or modelId"
            autocomplete="off"
            aria-expanded="false"
            value="${escapeHtml(getModelDisplayValue(initialModelValue))}"
          >
          <input type="hidden" name="modelId" value="${escapeHtml(findModelOption(initialModelValue))}">
          <button type="button" class="combo-toggle" data-batch-model-toggle aria-label="Toggle model list"></button>
        </div>
        <div class="combo-menu hidden" data-batch-model-menu role="listbox"></div>
      </div>
      <button type="button" class="row-remove">Remove</button>
    </div>
  `;

  bindBatchModelCombo(row);
  row.addEventListener("input", () => {
    syncBatchRowValidation(row);
    updateBatchReadyCount();
  });
  row.addEventListener("change", () => {
    syncBatchRowValidation(row);
    updateBatchReadyCount();
  });
  row.querySelector(".row-remove").addEventListener("click", () => {
    if (batchRows.children.length === 1) {
      row.querySelectorAll("input").forEach((input) => {
        input.value = "";
      });
      hideBatchModelMenu(row);
      clearBatchRowValidation(row);
    } else {
      row.remove();
    }
    updateBatchReadyCount();
  });

  if (!initialModelValue && batchAutoModelSelection.canonical) {
    applyModelSelectionToBatchRow(row, batchAutoModelSelection);
  }

  syncBatchRowValidation(row);
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
      modelInput: row.querySelector("[name='modelId']").value.trim()
        || resolveBatchModelValue(row.querySelector("[data-batch-model-input]")?.value.trim() || ""),
      siteId: sharedSiteId
    }))
    .filter((item) => item.name || item.mac || item.sn || item.modelInput);
}

function updateBatchReadyCount() {
  batchReadyCount.textContent = String(Math.max(getBatchPayload().length, 1));
}

function rerenderBatchRows() {
  const previous = getBatchPayload();
  rebuildBatchRows(previous);
}

function resetBatchForm(options = {}) {
  const preserveSiteSelection = options.preserveSiteSelection === true;
  const preserveAutoModel = options.preserveAutoModel === true;
  const keepResponseMessage = options.keepResponseMessage === true;
  if (!preserveAutoModel) {
    hideMenu(batchModelAutoMenu, batchModelAutoInput);
    batchModelAutoActiveIndex = -1;
    setBatchAutoModelSelection();
  }
  batchRows.innerHTML = "";
  batchRows.append(createBatchRow());
  if (isLockedSiteUser()) {
    applyLockedSiteScopeToInputs();
  } else if (!preserveSiteSelection) {
    batchSiteInput.value = "";
    selectedBatchSiteIdInput.value = "";
  }
  syncBatchRowCountInput();
  if (!keepResponseMessage) {
    resetResponseState(batchResponsePanel, batchResponseMessage);
  }
  updateBatchReadyCount();
}

function hideBatchModelMenu(row) {
  const input = row.querySelector("[data-batch-model-input]");
  const menu = row.querySelector("[data-batch-model-menu]");

  if (!input || !menu) {
    return;
  }

  hideMenu(menu, input);
  row.dataset.modelActiveIndex = "-1";
}

function renderBatchModelMenu(row, query = "") {
  const input = row.querySelector("[data-batch-model-input]");
  const hiddenInput = row.querySelector("[name='modelId']");
  const menu = row.querySelector("[data-batch-model-menu]");

  if (!input || !hiddenInput || !menu) {
    return;
  }

  const items = getFilteredModelCatalogItems(query);
  renderComboMenu(
    menu,
    items.map((item) => ({ ...item, label: item.shortType })),
    "No matching model. You can still paste a raw modelId.",
    (item) => {
      input.value = item.shortType;
      hiddenInput.value = item.modelId || "";
      hideBatchModelMenu(row);
      updateBatchReadyCount();
    }
  );

  const nextActiveIndex = normalizeCatalogText(query) && items.length > 0 ? 0 : -1;
  row.dataset.modelActiveIndex = String(nextActiveIndex);
  setActiveOption(menu, nextActiveIndex);
}

function commitBatchAutoModelSelection(options = {}) {
  const previousSelection = batchAutoModelSelection;
  const nextSelection = setBatchAutoModelSelection(getBatchAutoModelSelection());

  if (options.applyToExisting !== false) {
    syncBatchAutoModelToRows(previousSelection, nextSelection);
    return nextSelection;
  }

  return nextSelection;
}

function renderBatchModelAutoMenu(query = "") {
  if (!batchModelAutoInput || !selectedBatchModelAutoIdInput || !batchModelAutoMenu) {
    return;
  }

  const items = getFilteredModelCatalogItems(query);
  renderComboMenu(
    batchModelAutoMenu,
    items.map((item) => ({ ...item, label: item.shortType })),
    "No matching model. You can still paste a raw modelId.",
    (item) => {
      batchModelAutoInput.value = item.shortType;
      selectedBatchModelAutoIdInput.value = item.modelId || "";
      hideMenu(batchModelAutoMenu, batchModelAutoInput);
      batchModelAutoActiveIndex = -1;
      commitBatchAutoModelSelection();
    }
  );

  batchModelAutoActiveIndex = normalizeCatalogText(query) && items.length > 0 ? 0 : -1;
  setActiveOption(batchModelAutoMenu, batchModelAutoActiveIndex);
}

function bindBatchModelCombo(row) {
  const input = row.querySelector("[data-batch-model-input]");
  const hiddenInput = row.querySelector("[name='modelId']");
  const menu = row.querySelector("[data-batch-model-menu]");
  const toggle = row.querySelector("[data-batch-model-toggle]");

  if (!input || !hiddenInput || !menu || !toggle) {
    return;
  }

  row.dataset.modelActiveIndex = "-1";

  toggle.addEventListener("click", () => {
    if (menu.classList.contains("hidden")) {
      renderBatchModelMenu(row, input.value.trim());
      showMenu(menu, input);
      return;
    }

    hideBatchModelMenu(row);
  });

  input.addEventListener("focus", () => {
    renderBatchModelMenu(row, input.value.trim());
    showMenu(menu, input);
  });

  input.addEventListener("input", () => {
    hiddenInput.value = "";
    renderBatchModelMenu(row, input.value.trim());
    showMenu(menu, input);
  });

  input.addEventListener("keydown", (event) => {
    const nextIndex = handleComboKeys(event, menu, {
      activeIndex: Number(row.dataset.modelActiveIndex || -1),
      input
    });

    if (nextIndex === null) {
      return;
    }

    row.dataset.modelActiveIndex = String(nextIndex);
    setActiveOption(menu, nextIndex);
  });
}

function hasPendingBatchDraft() {
  return Array.from(batchRows.querySelectorAll(".batch-row")).some((row) => (
    row.querySelector("[name='name']")?.value.trim() ||
    row.querySelector("[name='mac']")?.value.trim() ||
    row.querySelector("[name='sn']")?.value.trim() ||
    row.querySelector("[data-batch-model-input]")?.value.trim()
  ));
}

async function requestViewChange(view) {
  if (!view || view === currentView) {
    return;
  }

  if (currentView === "multiple" && view !== "multiple" && hasPendingBatchDraft()) {
    const confirmed = await showConfirmModal({
      title: "Reset current batch?",
      message: "Switching tasks will reset all Multiple Devices row inputs. Are you sure you want to continue?",
      confirmLabel: "Yes, continue",
      cancelLabel: "No, stay here"
    });

    if (!confirmed) {
      return;
    }

    resetBatchForm();
  }

  activateView(view);
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
  const text = await readCsvFileText(file);
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
    const siteDisplayValue = item.parentName
      ? `${item.siteName || "-"} - ${item.parentName}`
      : (item.siteName || "-");
    const searchServerLabel = item.searchServerLabel || "-";
    const searchServerPortalUrl = getSearchServerPortalUrl(searchServerLabel);
    const ipValues = [item.wanIp, item.lanIp].filter(Boolean);
    const primaryIpAddress = ipValues[0] || "";
    const ipDisplayValue = ipValues.join(" / ") || "-";
    const searchServerMarkup = searchServerPortalUrl
      ? `<a class="search-cell-link" href="${searchServerPortalUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(searchServerLabel)}</a>`
      : escapeHtml(searchServerLabel);
    const ipInfoButtonMarkup = primaryIpAddress
      ? `
        <button
          class="search-ip-info-button"
          type="button"
          data-ip-lookup-trigger
          data-ip-address="${escapeHtml(primaryIpAddress)}"
          aria-label="Show IP details for ${escapeHtml(primaryIpAddress)}"
          title="Show IP details for ${escapeHtml(primaryIpAddress)}"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.4"></circle>
            <path fill="currentColor" d="M8 6.1a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Zm1 1.6H7.9a.45.45 0 0 0 0 .9h.25v2.7H7.8a.45.45 0 0 0 0 .9H9.1a.45.45 0 0 0 0-.9h-.05V8.15A.45.45 0 0 0 9 7.7Z"></path>
          </svg>
        </button>
      `
      : "";
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
        <span class="search-cell-value search-ip-value">
          <span>${escapeHtml(ipDisplayValue)}</span>
          ${ipInfoButtonMarkup}
        </span>
      </span>
      <span class="search-cell">
        <small class="search-cell-label">Site</small>
        <span class="search-cell-value">${escapeHtml(siteDisplayValue)}</span>
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
  await runSearch(searchInput.value.trim(), { showOverlay: false });
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

  filteredModelItems = getFilteredModelCatalogItems(query);
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
  renderSites(sipAccountSiteMenu, sipAccountSiteInput, selectedSipAccountSiteIdInput, (value) => {
    sipAccountSiteActiveIndex = value;
  });
  applyLockedSiteScopeToInputs();
}

async function loadAccounts(query = "", options = {}) {
  const forceReload = options.forceReload === true;

  if (forceReload || accountItems.length === 0) {
    const response = await apiFetch("/api/accounts");
    const data = await response.json();
    accountItems = data.items || [];
    setCounterText(accountsTotalCount, data.total || accountItems.length);
  }

  filteredAccountItems = getFilteredAccountItems(query);
  renderDeviceAccountMenu(deviceAccountInput?.value.trim() || query);
  applyAccountsFilter();
}

async function runSearch(query = "", options = {}) {
  const showOverlay = options.showOverlay !== false;
  activeSearchRequestCount += 1;
  if (showOverlay) {
    activeManualSearchRequestCount += 1;
  }
  setSearchLoadingState(true, { showOverlay });

  try {
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
  } finally {
    activeSearchRequestCount = Math.max(0, activeSearchRequestCount - 1);
    if (showOverlay) {
      activeManualSearchRequestCount = Math.max(0, activeManualSearchRequestCount - 1);
    }
    setSearchLoadingState(activeSearchRequestCount > 0, { showOverlay });
  }
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
  button.addEventListener("click", () => requestViewChange(button.dataset.view));
});

quickAddButton.addEventListener("click", () => requestViewChange("device"));

confirmModalConfirmButton?.addEventListener("click", () => {
  closeConfirmModal(true);
});

confirmModalCancelButton?.addEventListener("click", () => {
  closeConfirmModal(false);
});

confirmModal?.addEventListener("click", (event) => {
  if (event.target === confirmModal) {
    closeConfirmModal(false);
  }
});

ipLookupModalCloseButton?.addEventListener("click", () => {
  closeIpLookupModal();
});

ipLookupModal?.addEventListener("click", (event) => {
  if (event.target === ipLookupModal) {
    closeIpLookupModal();
  }
});

sipAccountCancelButton?.addEventListener("click", () => {
  closeSipAccountModal();
});

sipAccountModal?.addEventListener("click", (event) => {
  if (event.target === sipAccountModal) {
    closeSipAccountModal();
  }
});

searchResults?.addEventListener("click", (event) => {
  const trigger = event.target instanceof Element
    ? event.target.closest("[data-ip-lookup-trigger]")
    : null;

  if (!trigger) {
    return;
  }

  openIpLookupModal(trigger.dataset.ipAddress || "", trigger);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sipAccountModal && !sipAccountModal.classList.contains("hidden")) {
    event.preventDefault();
    closeSipAccountModal();
    return;
  }

  if (event.key === "Escape" && ipLookupModal && !ipLookupModal.classList.contains("hidden")) {
    event.preventDefault();
    closeIpLookupModal();
    return;
  }

  if (event.key === "Escape" && confirmModalResolver && confirmModal && !confirmModal.classList.contains("hidden")) {
    event.preventDefault();
    closeConfirmModal(false);
  }
});

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

batchModelAutoToggle.addEventListener("click", async () => {
  if (batchModelAutoMenu.classList.contains("hidden")) {
    await loadModels(batchModelAutoInput.value.trim());
    renderBatchModelAutoMenu(batchModelAutoInput.value.trim());
    showMenu(batchModelAutoMenu, batchModelAutoInput);
    return;
  }

  hideMenu(batchModelAutoMenu, batchModelAutoInput);
  batchModelAutoActiveIndex = -1;
});

deviceAccountToggle.addEventListener("click", async () => {
  if (deviceAccountMenu.classList.contains("hidden")) {
    await loadAccounts(deviceAccountInput.value.trim());
    renderDeviceAccountMenu(deviceAccountInput.value.trim());
    showMenu(deviceAccountMenu, deviceAccountInput);
    return;
  }

  hideMenu(deviceAccountMenu, deviceAccountInput);
  deviceAccountActiveIndex = -1;
});

deviceAccountAddButton.addEventListener("click", async () => {
  await loadSites();
  openSipAccountModal({
    source: "device",
    siteId: selectedSiteIdInput.value.trim()
  });
});

accountsAddButton.addEventListener("click", async () => {
  await loadSites();
  openSipAccountModal({
    source: "accounts"
  });
});

accountsRefreshButton.addEventListener("click", async () => {
  try {
    await loadAccounts(accountsSearchInput.value.trim(), { forceReload: true });
    setResponseState(accountsResponsePanel, accountsResponseBadge, accountsResponseMessage, true, "SIP account list refreshed.");
  } catch (error) {
    setResponseState(
      accountsResponsePanel,
      accountsResponseBadge,
      accountsResponseMessage,
      false,
      error instanceof Error ? error.message : "Unable to refresh SIP accounts."
    );
  }
});

sipAccountSiteToggle.addEventListener("click", async () => {
  if (isLockedSiteUser()) {
    return;
  }

  if (sipAccountSiteMenu.classList.contains("hidden")) {
    await loadSites(sipAccountSiteInput.value.trim());
    showMenu(sipAccountSiteMenu, sipAccountSiteInput);
    return;
  }

  hideMenu(sipAccountSiteMenu, sipAccountSiteInput);
  sipAccountSiteActiveIndex = -1;
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

batchModelAutoInput.addEventListener("focus", async () => {
  await loadModels(batchModelAutoInput.value.trim());
  renderBatchModelAutoMenu(batchModelAutoInput.value.trim());
  showMenu(batchModelAutoMenu, batchModelAutoInput);
});

batchModelAutoInput.addEventListener("input", async () => {
  selectedBatchModelAutoIdInput.value = "";
  await loadModels(batchModelAutoInput.value.trim());
  renderBatchModelAutoMenu(batchModelAutoInput.value.trim());
  showMenu(batchModelAutoMenu, batchModelAutoInput);
});

deviceAccountInput.addEventListener("focus", async () => {
  await loadAccounts(deviceAccountInput.value.trim());
  renderDeviceAccountMenu(deviceAccountInput.value.trim());
  showMenu(deviceAccountMenu, deviceAccountInput);
});

deviceAccountInput.addEventListener("input", async () => {
  selectedDeviceAccountIdInput.value = "";
  if (!deviceAccountInput.value.trim()) {
    setSelectedDeviceAccount(null);
  }
  await loadAccounts(deviceAccountInput.value.trim());
  renderDeviceAccountMenu(deviceAccountInput.value.trim());
  showMenu(deviceAccountMenu, deviceAccountInput);
});

sipAccountSiteInput.addEventListener("focus", async () => {
  if (isLockedSiteUser()) {
    return;
  }

  await loadSites(sipAccountSiteInput.value.trim());
  showMenu(sipAccountSiteMenu, sipAccountSiteInput);
});

sipAccountSiteInput.addEventListener("input", async () => {
  if (isLockedSiteUser()) {
    return;
  }

  selectedSipAccountSiteIdInput.value = "";
  await loadSites(sipAccountSiteInput.value.trim());
  showMenu(sipAccountSiteMenu, sipAccountSiteInput);
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

batchModelAutoInput.addEventListener("keydown", (event) => {
  const nextIndex = handleComboKeys(event, batchModelAutoMenu, {
    activeIndex: batchModelAutoActiveIndex,
    input: batchModelAutoInput
  });

  if (nextIndex !== null) {
    batchModelAutoActiveIndex = nextIndex;
    setActiveOption(batchModelAutoMenu, batchModelAutoActiveIndex);
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    hideMenu(batchModelAutoMenu, batchModelAutoInput);
    batchModelAutoActiveIndex = -1;
    commitBatchAutoModelSelection();
  }
});

deviceAccountInput.addEventListener("keydown", (event) => {
  const nextIndex = handleComboKeys(event, deviceAccountMenu, {
    activeIndex: deviceAccountActiveIndex,
    input: deviceAccountInput
  });

  if (nextIndex === null) {
    return;
  }

  deviceAccountActiveIndex = nextIndex;
  setActiveOption(deviceAccountMenu, deviceAccountActiveIndex);
});

sipAccountSiteInput.addEventListener("keydown", (event) => {
  if (isLockedSiteUser()) {
    return;
  }

  const nextIndex = handleComboKeys(event, sipAccountSiteMenu, {
    activeIndex: sipAccountSiteActiveIndex,
    input: sipAccountSiteInput
  });

  if (nextIndex === null) {
    return;
  }

  sipAccountSiteActiveIndex = nextIndex;
  setActiveOption(sipAccountSiteMenu, sipAccountSiteActiveIndex);
});

batchModelAutoInput.addEventListener("change", () => {
  commitBatchAutoModelSelection();
});

batchRowCountInput.addEventListener("input", () => {
  syncBatchRowCountInput();
});

accountsSearchInput.addEventListener("input", () => {
  updateInputClearButton(accountsSearchInput, accountsSearchClearButton);
  applyAccountsFilter();
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

  if (!event.target.closest("#batch-model-auto-combo")) {
    hideMenu(batchModelAutoMenu, batchModelAutoInput);
    batchModelAutoActiveIndex = -1;
  }

  if (!event.target.closest("#device-account-combo")) {
    hideMenu(deviceAccountMenu, deviceAccountInput);
    deviceAccountActiveIndex = -1;
  }

  if (!event.target.closest("#sip-account-site-combo")) {
    hideMenu(sipAccountSiteMenu, sipAccountSiteInput);
    sipAccountSiteActiveIndex = -1;
  }

  batchRows.querySelectorAll(".batch-row").forEach((row) => {
    const combo = row.querySelector(".batch-model-combo");
    if (combo && !combo.contains(event.target)) {
      hideBatchModelMenu(row);
    }
  });
});

deviceForm.addEventListener("reset", () => {
  hideMenu(modelMenu, modelInput);
  hideMenu(siteMenu, siteInput);
  hideMenu(deviceAccountMenu, deviceAccountInput);
  modelActiveIndex = -1;
  siteActiveIndex = -1;
  deviceAccountActiveIndex = -1;
  resetResponseState(responsePanel, responseMessage);
  selectedModelIdInput.value = "";
  setSelectedDeviceAccount(null);
  if (isLockedSiteUser()) {
    applyLockedSiteScopeToInputs();
  } else {
    selectedSiteIdInput.value = "";
  }
});

sipAccountForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  sipAccountSaveButton.disabled = true;
  sipAccountSaveButton.textContent = "Saving...";

  try {
    const response = await apiFetch("/api/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildSipAccountPayload())
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.message || "SIP account request failed.");
    }

    const createdAccount = normalizeCreatedAccount(data.payload, data.requestBody);
    if (createdAccount.id) {
      mergeAccountItem(createdAccount);
    } else {
      await loadAccounts("", { forceReload: true });
    }

    if (sipAccountModalContext.source === "device") {
      if (sipBindAfterSaveCheckbox.checked && createdAccount.id) {
        setSelectedDeviceAccount(createdAccount);
      }

      setResponseState(
        responsePanel,
        responseBadge,
        responseMessage,
        true,
        sipBindAfterSaveCheckbox.checked
          ? `${data.message} It is selected for binding when you save the device.`
          : `${data.message} You can select it later from the SIP Account list.`
      );
    } else {
      setResponseState(accountsResponsePanel, accountsResponseBadge, accountsResponseMessage, true, data.message || "SIP account created successfully.");
    }

    closeSipAccountModal();
  } catch (error) {
    setResponseState(
      sipAccountResponsePanel,
      sipAccountResponseBadge,
      sipAccountResponseMessage,
      false,
      error instanceof Error ? error.message : "SIP account request failed."
    );
  } finally {
    sipAccountSaveButton.disabled = false;
    sipAccountSaveButton.textContent = "Save SIP Account";
  }
});

deviceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  if (deviceAccountInput.value.trim() && !selectedDeviceAccountIdInput.value.trim()) {
    setResponseState(responsePanel, responseBadge, responseMessage, false, "Choose a SIP account from the list or clear the SIP Account field.");
    saveButton.disabled = false;
    saveButton.textContent = "Save";
    return;
  }

  const payload = {
    name: deviceForm.elements.name.value.trim(),
    mac: deviceForm.elements.mac.value.trim(),
    sn: deviceForm.elements.sn.value.trim(),
    modelInput: selectedModelIdInput.value.trim() || deviceForm.elements.modelInput.value.trim(),
    siteId: selectedSiteIdInput.value.trim() || deviceForm.elements.siteInput.value.trim(),
    sipBinding: selectedDeviceAccountIdInput.value.trim()
      ? {
          accountId: selectedDeviceAccountIdInput.value.trim(),
          lineId: 1,
          accountType: 0
        }
      : null
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
    setResponseState(responsePanel, responseBadge, responseMessage, Boolean(data.ok), data.ok ? buildSuccessMessage(data) : message);
    if (data.ok || data.deviceCreated) {
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
  const { limitReached } = addBatchRows(1, { reuseBlankRow: false });
  if (limitReached) {
    setResponseState(batchResponsePanel, batchResponseBadge, batchResponseMessage, false, `You can add up to ${MAX_BATCH_ROWS} batch rows at one time.`);
  }
});

batchAddManyButton.addEventListener("click", () => {
  const requestedRows = syncBatchRowCountInput();
  const { rowsAdded, limitReached } = addBatchRows(requestedRows);
  if (limitReached) {
    setResponseState(
      batchResponsePanel,
      batchResponseBadge,
      batchResponseMessage,
      false,
      `Only ${rowsAdded} rows were added because the batch limit is ${MAX_BATCH_ROWS}.`
    );
    return;
  }

  resetResponseState(batchResponsePanel, batchResponseMessage);
});

batchClearButton.addEventListener("click", async () => {
  const confirmed = await showConfirmModal({
    title: "Clear current batch?",
    message: "This will remove all current Multiple Devices rows and reset the form back to one empty row. Do you want to continue?",
    confirmLabel: "Yes, clear",
    cancelLabel: "No, stay here"
  });

  if (!confirmed) {
    return;
  }

  resetBatchForm();
});

batchForm.addEventListener("reset", () => {
  resetBatchForm();
});

batchForm.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || !(event.target instanceof HTMLInputElement)) {
    return;
  }

  const row = event.target.closest(".batch-row");
  if (!row) {
    return;
  }

  if (event.target.name === "mac") {
    event.preventDefault();
    focusBatchInput(getBatchRowInputs(row).sn);
    return;
  }

  if (event.target.name === "sn") {
    event.preventDefault();
    focusNextBatchMacInput(row);
  }
});

async function submitBatchForm() {
  const validation = validateBatchRows();

  if (validation.populatedRowCount === 0) {
    setResponseState(batchResponsePanel, batchResponseBadge, batchResponseMessage, false, "Add at least one device row before saving.");
    return;
  }

  if (validation.invalidRows.length > 0) {
    const rowLabel = validation.invalidRows.length === 1
      ? `row ${validation.invalidRows[0]}`
      : `rows ${validation.invalidRows.join(", ")}`;
    setResponseState(batchResponsePanel, batchResponseBadge, batchResponseMessage, false, `Fix the highlighted MAC or Serial fields on ${rowLabel} before saving.`);
    return;
  }

  const batchSiteId = getSelectedBatchSiteId();
  if (!batchSiteId) {
    setResponseState(batchResponsePanel, batchResponseBadge, batchResponseMessage, false, "Choose one site for the whole batch before saving.");
    return;
  }

  const devices = getBatchPayload();
  const submittedDevices = devices.map((device) => ({ ...device }));
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
      resetBatchForm({
        preserveSiteSelection: true,
        preserveAutoModel: true,
        keepResponseMessage: true
      });
      await refreshSearchData();
    } else {
      if (keepOnlyFailedBatchRows(submittedDevices, data.failedRows)) {
        validateBatchRows();
      }
      if (getBatchSuccessCount(data) > 0) {
        await refreshSearchData();
      }
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
    const text = await readCsvFileText(file);
    const importedRows = mapCsvRows(text);

    if (importedRows.length === 0) {
      throw new Error("The CSV file did not contain any device rows.");
    }

    const visibleRows = importedRows.slice(0, MAX_BATCH_ROWS);
    batchRows.innerHTML = "";
    visibleRows.forEach((item) => {
      batchRows.append(createBatchRow(item));
    });
    updateBatchReadyCount();
    const message = importedRows.length > MAX_BATCH_ROWS
      ? `${visibleRows.length} rows loaded from CSV. Extra rows were skipped because the batch limit is ${MAX_BATCH_ROWS}.`
      : `${visibleRows.length} rows loaded from CSV.`;
    setResponseState(batchResponsePanel, batchResponseBadge, batchResponseMessage, true, message);
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

accountsSearchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    applyAccountsFilter();
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
bindClearableInput(accountsSearchInput, accountsSearchClearButton, () => {
  applyAccountsFilter();
});

bootstrapSession();
