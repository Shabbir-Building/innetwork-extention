console.log("[LinkedIn Group Lister] content script loaded");

const LIST_BUTTON_ID = "lgl-list-button";
const PROFILE_URL_PATTERN = /^https:\/\/www\.linkedin\.com\/in\/[^/?#]+/;

function isProfilePage() {
  return PROFILE_URL_PATTERN.test(window.location.href);
}

function getCanonicalProfileUrl() {
  const match = window.location.href.match(PROFILE_URL_PATTERN);
  return match ? match[0] : window.location.href;
}

function getProfileName() {
  // LinkedIn's DOM classes are fully hashed and carry no semantic meaning, so
  // we anchor on <title> ("{Name} | LinkedIn") instead of any element class.
  const title = document.title.split("|")[0].trim();
  return title || null;
}

function getProfilePhotoUrl() {
  // No stable class survives LinkedIn's hashing, so we pick the profile photo
  // structurally: the largest roughly-square image in the top portion of the
  // page. Cover photos are wide/short; the profile photo is square.
  const candidates = Array.from(document.querySelectorAll("main img")).filter(
    (img) => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) return false;
      const aspectRatio = w / h;
      return w >= 60 && aspectRatio > 0.85 && aspectRatio < 1.15;
    }
  );

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const areaA = (a.naturalWidth || a.width) * (a.naturalHeight || a.height);
    const areaB = (b.naturalWidth || b.width) * (b.naturalHeight || b.height);
    return areaB - areaA;
  });

  return candidates[0].src;
}

function extractProfileData() {
  return {
    name: getProfileName(),
    photoUrl: getProfilePhotoUrl(),
    profileUrl: getCanonicalProfileUrl(),
  };
}

function findActionButtonRow() {
  const labels = ["message", "follow", "connect", "more"];
  const buttons = Array.from(document.querySelectorAll("main button"));
  const actionButton = buttons.find((btn) => {
    const text = (btn.textContent || "").trim().toLowerCase();
    const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();
    return labels.some(
      (label) => text.startsWith(label) || ariaLabel.startsWith(label)
    );
  });
  return actionButton ? actionButton.parentElement : null;
}

function createListButton() {
  const button = document.createElement("button");
  button.id = LIST_BUTTON_ID;
  button.type = "button";
  button.className = "lgl-list-btn";
  button.innerHTML =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><rect x="2" y="3" width="12" height="10" rx="2"></rect><path d="M5 6.5h6M5 9.5h4"></path></svg><span>List</span>';
  button.addEventListener("click", () => {
    const data = extractProfileData();
    console.log("[LinkedIn Group Lister] profile data:", data);
  });
  return button;
}

function injectListButton() {
  if (!isProfilePage()) return;
  if (document.getElementById(LIST_BUTTON_ID)) return;

  const row = findActionButtonRow();
  if (!row) return;

  row.appendChild(createListButton());
}

function removeListButton() {
  const existing = document.getElementById(LIST_BUTTON_ID);
  if (existing) existing.remove();
}

const observer = new MutationObserver(() => {
  if (isProfilePage()) {
    injectListButton();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

function handleNavigation() {
  removeListButton();
  if (isProfilePage()) {
    injectListButton();
  }
}

const originalPushState = history.pushState;
history.pushState = function (...args) {
  originalPushState.apply(this, args);
  handleNavigation();
};

const originalReplaceState = history.replaceState;
history.replaceState = function (...args) {
  originalReplaceState.apply(this, args);
  handleNavigation();
};

window.addEventListener("popstate", handleNavigation);

handleNavigation();
