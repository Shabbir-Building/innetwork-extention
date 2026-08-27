import { isDarkMode } from "./theme";
import {
  getGroups,
  getMembersForGroup,
  type GroupWithCount,
  type Member,
} from "./storage";

const FAB_HOST_ID = "lgl-fab-host";
const PANEL_HOST_ID = "lgl-panel-host";

const SHARED_TOKENS = `
  --ink: #16232b;
  --ink-soft: #3c4c55;
  --paper: #fdfefe;
  --canvas: #f4f7f8;
  --line: #e4e9ec;
  --line-strong: #cfd8dc;
  --muted: #6b7b85;
  --accent: #2a5c6b;
  --accent-soft: #e8f1f3;
  --shadow: 0 1px 2px rgba(22,35,43,0.06), 0 8px 24px -8px rgba(22,35,43,0.18);
  --on-accent: #ffffff;
`;

const SHARED_DARK_TOKENS = `
  --ink: #eaf1f3;
  --ink-soft: #b9c6cb;
  --paper: #1a2529;
  --canvas: #141c1f;
  --line: #2a363b;
  --line-strong: #3a484e;
  --muted: #8ca0a8;
  --accent: #6fb5c4;
  --accent-soft: #20363b;
  --shadow: 0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -8px rgba(0,0,0,0.5);
  --on-accent: #0f1a1d;
`;

const FAB_STYLES = `
  :host { all: initial; ${SHARED_TOKENS} }
  :host(.dark) { ${SHARED_DARK_TOKENS} }

  * { box-sizing: border-box; }

  .fab {
    position: fixed;
    right: 20px;
    bottom: 20px;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: var(--shadow);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--on-accent);
    border: none;
    cursor: pointer;
    z-index: 2147482900;
    font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
  }

  .fab:hover {
    filter: brightness(1.05);
  }

  .fab svg {
    width: 20px;
    height: 20px;
  }
`;

const PANEL_STYLES = `
  :host { all: initial; ${SHARED_TOKENS} }
  :host(.dark) { ${SHARED_DARK_TOKENS} }

  * { box-sizing: border-box; }

  .panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 380px;
    max-width: 90vw;
    background: var(--paper);
    border-left: 1px solid var(--line);
    box-shadow: -8px 0 24px -12px rgba(22, 35, 43, 0.25);
    display: flex;
    flex-direction: column;
    z-index: 2147482950;
    font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
  }

  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 18px 22px 16px;
    border-bottom: 1px solid var(--line);
    flex-shrink: 0;
  }

  .panel-head-text { min-width: 0; }

  .eyebrow {
    font-family: ui-monospace, "SF Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .title {
    font-size: 18px;
    font-weight: 600;
    margin-top: 4px;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .close-btn {
    all: unset;
    cursor: pointer;
    color: var(--muted);
    padding: 6px;
    border-radius: 6px;
    line-height: 0;
    flex-shrink: 0;
    display: inline-flex;
  }

  .close-btn:hover {
    background: var(--canvas);
  }

  .close-btn svg {
    width: 16px;
    height: 16px;
  }

  .back-link {
    all: unset;
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--accent);
    padding: 12px 22px 6px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .back-link svg {
    width: 13px;
    height: 13px;
  }

  .scroll-area {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .empty-state {
    padding: 32px 16px;
    text-align: center;
    font-size: 12.5px;
    color: var(--muted);
    line-height: 1.6;
  }

  .group-card {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 13px 15px;
    border: 1px solid var(--line);
    border-radius: 8px;
    cursor: pointer;
    width: 100%;
  }

  .group-card:hover {
    background: var(--canvas);
  }

  .gc-name {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .gc-count {
    font-family: ui-monospace, "SF Mono", monospace;
    font-size: 11px;
    font-weight: 500;
    color: var(--muted);
    background: var(--canvas);
    border: 1px solid var(--line);
    border-radius: 5px;
    padding: 2px 7px;
    flex-shrink: 0;
  }

  .divider {
    margin: 4px 4px 0;
    font-family: ui-monospace, "SF Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--line);
  }

  .member-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 7px;
    text-decoration: none;
    color: inherit;
  }

  .member-row:hover {
    background: var(--canvas);
  }

  .m-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #5b6b74, #2c3a41);
    background-size: cover;
    background-position: center;
    flex-shrink: 0;
  }

  .m-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--ink);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .m-link {
    color: var(--muted);
    width: 13px;
    height: 13px;
    flex-shrink: 0;
  }

  .loading-state {
    padding: 32px 16px;
    text-align: center;
    font-size: 12.5px;
    color: var(--muted);
  }
`;

function svgIcon(paths: string, viewBox = "0 0 16 16"): string {
  return `<svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.6">${paths}</svg>`;
}

function createFab(onClick: () => void): HTMLElement {
  const host = document.createElement("div");
  host.id = FAB_HOST_ID;
  if (isDarkMode()) host.classList.add("dark");

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = FAB_STYLES;
  shadow.appendChild(style);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "fab";
  button.setAttribute("aria-label", "Open your lists");
  button.innerHTML = svgIcon(
    '<rect x="3" y="4" width="14" height="12" rx="2.5"></rect><path d="M3 8.5h14M7 4v4"></path>',
    "0 0 20 20"
  );
  button.addEventListener("click", onClick);
  shadow.appendChild(button);

  return host;
}

type View = { kind: "groups" } | { kind: "members"; group: GroupWithCount };

function renderGroupsView(
  root: HTMLElement,
  groups: GroupWithCount[],
  onSelectGroup: (group: GroupWithCount) => void,
  onClose: () => void
): void {
  root.innerHTML = "";
  root.appendChild(buildPanelHead("Your lists", "LinkedIn Network", onClose));

  const scroll = document.createElement("div");
  scroll.className = "scroll-area";

  if (groups.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent =
      "No lists yet. Visit a LinkedIn profile and click List to create one.";
    scroll.appendChild(empty);
  } else {
    groups.forEach((group) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "group-card";

      const name = document.createElement("div");
      name.className = "gc-name";
      name.textContent = group.name;

      const count = document.createElement("div");
      count.className = "gc-count";
      count.textContent = String(group.memberCount);

      card.append(name, count);
      card.addEventListener("click", () => onSelectGroup(group));
      scroll.appendChild(card);
    });
  }

  root.appendChild(scroll);
}

function renderMembersView(
  root: HTMLElement,
  group: GroupWithCount,
  members: Member[] | null,
  onBack: () => void,
  onClose: () => void
): void {
  root.innerHTML = "";
  root.appendChild(buildPanelHead("List", group.name, onClose));

  const back = document.createElement("button");
  back.type = "button";
  back.className = "back-link";
  back.innerHTML = svgIcon('<path d="M7.5 2.5L3 6l4.5 3.5"></path>', "0 0 12 12") + "All groups";
  back.addEventListener("click", onBack);
  root.appendChild(back);

  const scroll = document.createElement("div");
  scroll.className = "scroll-area";

  if (members === null) {
    const loading = document.createElement("div");
    loading.className = "loading-state";
    loading.textContent = "Loading members…";
    scroll.appendChild(loading);
  } else if (members.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No members yet.";
    scroll.appendChild(empty);
  } else {
    const divider = document.createElement("div");
    divider.className = "divider";
    divider.textContent = `${members.length} member${members.length === 1 ? "" : "s"}`;
    scroll.appendChild(divider);

    members.forEach((member) => {
      const row = document.createElement("a");
      row.className = "member-row";
      row.href = member.profileUrl;
      row.target = "_blank";
      row.rel = "noopener noreferrer";

      const avatar = document.createElement("div");
      avatar.className = "m-avatar";
      if (member.photoUrl) {
        avatar.style.backgroundImage = `url(${JSON.stringify(member.photoUrl).slice(1, -1)})`;
      }

      const name = document.createElement("div");
      name.className = "m-name";
      name.textContent = member.name || "Unknown profile";

      const link = document.createElement("div");
      link.innerHTML = svgIcon(
        '<path d="M6.5 9.5l3-3M8 3.5h4.5V8M12.5 3.5L7 9"></path>'
      );
      link.className = "m-link";

      row.append(avatar, name, link);
      scroll.appendChild(row);
    });
  }

  root.appendChild(scroll);
}

function createPanel(): {
  host: HTMLElement;
  scrollRoot: HTMLElement;
} {
  const host = document.createElement("div");
  host.id = PANEL_HOST_ID;
  if (isDarkMode()) host.classList.add("dark");

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = PANEL_STYLES;
  shadow.appendChild(style);

  const panel = document.createElement("div");
  panel.className = "panel";

  const contentRoot = document.createElement("div");
  contentRoot.style.display = "contents";

  panel.appendChild(contentRoot);
  shadow.appendChild(panel);

  return { host, scrollRoot: contentRoot };
}

function buildPanelHead(
  eyebrowText: string,
  titleText: string,
  onClose: () => void
): HTMLElement {
  const head = document.createElement("div");
  head.className = "panel-head";

  const headText = document.createElement("div");
  headText.className = "panel-head-text";
  const eyebrow = document.createElement("div");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = eyebrowText;
  const title = document.createElement("div");
  title.className = "title";
  title.textContent = titleText;
  headText.append(eyebrow, title);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "close-btn";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.innerHTML = svgIcon('<path d="M4 4l8 8M12 4l-8 8"></path>');
  closeBtn.addEventListener("click", onClose);

  head.append(headText, closeBtn);
  return head;
}

let currentPanel: { host: HTMLElement } | null = null;

function closePanel(): void {
  if (!currentPanel) return;
  currentPanel.host.remove();
  currentPanel = null;
  document.removeEventListener("keydown", handlePanelKeydown);
}

function handlePanelKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") closePanel();
}

async function openPanel(): Promise<void> {
  if (currentPanel) {
    closePanel();
    return;
  }

  const { host, scrollRoot } = createPanel();
  currentPanel = { host };
  document.body.appendChild(host);
  document.addEventListener("keydown", handlePanelKeydown);

  let view: View = { kind: "groups" };
  // Incremented on every navigation so an in-flight fetch from a view the
  // user has since left (e.g. clicked "All groups" before it resolved)
  // knows not to render its stale result.
  let requestToken = 0;

  function goToGroups(): void {
    view = { kind: "groups" };
    void renderCurrentView();
  }

  function goToMembers(group: GroupWithCount): void {
    view = { kind: "members", group };
    void renderCurrentView();
  }

  async function renderCurrentView(): Promise<void> {
    const thisRequest = ++requestToken;

    if (view.kind === "groups") {
      const groups = await getGroups();
      if (thisRequest !== requestToken) return;
      renderGroupsView(scrollRoot, groups, goToMembers, closePanel);
      return;
    }

    const group = view.group;
    renderMembersView(scrollRoot, group, null, goToGroups, closePanel);
    const members = await getMembersForGroup(group.id);
    if (thisRequest !== requestToken) return;
    renderMembersView(scrollRoot, group, members, goToGroups, closePanel);
  }

  await renderCurrentView();
}

export function mountFloatingButtonAndPanel(): void {
  if (document.getElementById(FAB_HOST_ID)) return;
  const fab = createFab(() => {
    void openPanel();
  });
  document.body.appendChild(fab);
}
