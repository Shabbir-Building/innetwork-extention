console.log("[LinkedIn Group Lister] content script loaded");

interface ProfileData {
  name: string | null;
  photoUrl: string | null;
  profileUrl: string;
}

const LIST_BUTTON_ID = "lgl-list-button";
const PROFILE_URL_PATTERN = /^https:\/\/www\.linkedin\.com\/in\/[^/?#]+/;

function isProfilePage(): boolean {
  return PROFILE_URL_PATTERN.test(window.location.href);
}

function isDarkMode(): boolean {
  // LinkedIn's modern surfaces (feed/profile/messaging) mark theme via a
  // data attribute on <body>; older Ember-based pages use a class on
  // <html>/<body> instead. Check both since either can apply depending on
  // which surface rendered. Not tied to prefers-color-scheme: LinkedIn's
  // dark mode is an independent in-app setting (Device/Dark/Light).
  if (document.body.getAttribute("data-color-scheme") === "dark") return true;
  if (document.documentElement.classList.contains("theme--dark")) return true;
  if (document.body.classList.contains("theme--dark")) return true;
  return false;
}

function getCanonicalProfileUrl(): string {
  const match = window.location.href.match(PROFILE_URL_PATTERN);
  return match ? match[0] : window.location.href;
}

function getProfileName(): string | null {
  // LinkedIn's DOM classes are fully hashed and carry no semantic meaning, so
  // we anchor on <title> ("{Name} | LinkedIn") instead of any element class.
  const title = (document.title.split("|")[0] ?? "").trim();
  return title || null;
}

function getProfilePhotoUrl(): string | null {
  // No stable class survives LinkedIn's hashing, so we pick the profile photo
  // structurally: the largest roughly-square image in the top portion of the
  // page. Cover photos are wide/short; the profile photo is square.
  const candidates = Array.from(
    document.querySelectorAll<HTMLImageElement>("main img")
  ).filter((img) => {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return false;
    const aspectRatio = w / h;
    return w >= 60 && aspectRatio > 0.85 && aspectRatio < 1.15;
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const areaA = (a.naturalWidth || a.width) * (a.naturalHeight || a.height);
    const areaB = (b.naturalWidth || b.width) * (b.naturalHeight || b.height);
    return areaB - areaA;
  });

  const best = candidates[0];
  return best ? best.src : null;
}

function extractProfileData(): ProfileData {
  return {
    name: getProfileName(),
    photoUrl: getProfilePhotoUrl(),
    profileUrl: getCanonicalProfileUrl(),
  };
}

function findActionButtons(): HTMLButtonElement[] {
  const labels = ["message", "follow", "connect", "more"];
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("main button")
  );
  return buttons.filter((btn) => {
    const text = (btn.textContent || "").trim().toLowerCase();
    const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();
    return labels.some(
      (label) => text.startsWith(label) || ariaLabel.startsWith(label)
    );
  });
}

// LinkedIn sometimes wraps each action button in its own container, so the
// direct parent of a single button isn't necessarily the shared row. Walk up
// from two matched buttons until we find their common ancestor — that's the
// actual flex row we want to append into.
function findActionButtonRow(): HTMLElement | null {
  const actionButtons = findActionButtons();
  if (actionButtons.length === 0) return null;

  const first = actionButtons[0];
  if (!first) return null;
  if (actionButtons.length === 1) return first.parentElement;

  const second = actionButtons[1];
  if (!second) return first.parentElement;

  let ancestor: HTMLElement | null = first.parentElement;
  while (ancestor && !ancestor.contains(second)) {
    ancestor = ancestor.parentElement;
  }
  return ancestor ?? first.parentElement;
}

function createListButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.id = LIST_BUTTON_ID;
  button.type = "button";
  button.className = isDarkMode() ? "lgl-list-btn lgl-dark" : "lgl-list-btn";
  button.innerHTML =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><rect x="2" y="3" width="12" height="10" rx="2"></rect><path d="M5 6.5h6M5 9.5h4"></path></svg><span>List</span>';
  button.addEventListener("click", () => {
    const data = extractProfileData();
    console.log("[LinkedIn Group Lister] profile data:", data);
  });
  return button;
}

function injectListButton(): void {
  if (!isProfilePage()) return;
  if (document.getElementById(LIST_BUTTON_ID)) return;

  const row = findActionButtonRow();
  if (!row) return;

  row.appendChild(createListButton());
}

function removeListButton(): void {
  const existing = document.getElementById(LIST_BUTTON_ID);
  if (existing) existing.remove();
}

const observer = new MutationObserver(() => {
  if (isProfilePage()) {
    injectListButton();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

function handleNavigation(): void {
  removeListButton();
  if (isProfilePage()) {
    injectListButton();
  }
}

const originalPushState = history.pushState;
history.pushState = function (
  this: History,
  ...args: Parameters<History["pushState"]>
) {
  originalPushState.apply(this, args);
  handleNavigation();
};

const originalReplaceState = history.replaceState;
history.replaceState = function (
  this: History,
  ...args: Parameters<History["replaceState"]>
) {
  originalReplaceState.apply(this, args);
  handleNavigation();
};

window.addEventListener("popstate", handleNavigation);

handleNavigation();
