import type { ProfileData } from "./content";
import { isDarkMode } from "./theme";

const HOST_ID = "lgl-modal-host";

// Step 2: hardcoded groups purely for UI — replaced with real
// chrome.storage.local data in Step 3.
const FAKE_GROUPS = [
  { name: "Recruiters", count: 12 },
  { name: "Q3 Outreach", count: 7 },
  { name: "Conference — Madrid", count: 3 },
];

const MODAL_STYLES = `
  :host {
    all: initial;
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
    --overlay-tint: rgba(22, 35, 43, 0.45);
    --on-accent: #ffffff;
  }

  :host(.dark) {
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
    --overlay-tint: rgba(0, 0, 0, 0.6);
    --on-accent: #0f1a1d;
  }

  * {
    box-sizing: border-box;
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: var(--overlay-tint);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483000;
    font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
  }

  .card {
    width: 340px;
    max-height: 80vh;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 10px;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 18px;
    border-bottom: 1px solid var(--line);
  }

  .avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #5b6b74, #2c3a41);
    background-size: cover;
    background-position: center;
    flex-shrink: 0;
  }

  .head-text {
    flex: 1;
    min-width: 0;
  }

  .head-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
  }

  .head-name {
    font-size: 14.5px;
    font-weight: 600;
    margin-top: 2px;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .close-btn {
    all: unset;
    cursor: pointer;
    color: var(--muted);
    padding: 4px;
    border-radius: 4px;
    line-height: 0;
  }

  .close-btn:hover {
    background: var(--canvas);
  }

  .group-list {
    padding: 14px 18px 6px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow-y: auto;
  }

  .group-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 7px;
    border: 1px solid transparent;
    cursor: pointer;
    background: none;
    font-family: inherit;
    text-align: left;
    width: 100%;
  }

  .group-row:hover {
    background: var(--canvas);
  }

  .group-row.selected {
    background: var(--accent-soft);
    border-color: var(--accent);
  }

  .radio {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 1.5px solid var(--line-strong);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .group-row.selected .radio {
    border-color: var(--accent);
  }

  .radio .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    display: none;
  }

  .group-row.selected .radio .dot {
    display: block;
  }

  .gname {
    font-size: 13.5px;
    font-weight: 500;
    color: var(--ink);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .gcount {
    font-family: ui-monospace, "SF Mono", monospace;
    font-size: 10.5px;
    color: var(--muted);
    background: var(--canvas);
    border: 1px solid var(--line);
    border-radius: 5px;
    padding: 2px 6px;
    flex-shrink: 0;
  }

  .empty-state {
    padding: 20px 10px;
    text-align: center;
    font-size: 12.5px;
    color: var(--muted);
  }

  .new-group-row {
    margin: 6px 18px 16px;
    display: flex;
    gap: 8px;
  }

  .new-group-row input {
    flex: 1;
    min-width: 0;
    font-family: inherit;
    font-size: 12.5px;
    border: 1px solid var(--line-strong);
    border-radius: 7px;
    padding: 8px 10px;
    background: var(--paper);
    color: var(--ink);
  }

  .new-group-row input:focus {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }

  .new-group-row input::placeholder {
    color: var(--muted);
  }

  .plus-btn {
    all: unset;
    cursor: pointer;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: var(--accent);
    border: 1px solid var(--line);
    background: var(--paper);
    border-radius: 7px;
    padding: 8px 12px;
    white-space: nowrap;
  }

  .plus-btn:hover {
    background: var(--canvas);
  }

  .foot {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 18px;
    border-top: 1px solid var(--line);
    background: var(--canvas);
  }

  .btn {
    all: unset;
    cursor: pointer;
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 600;
    border-radius: 7px;
    padding: 7px 16px;
    border: 1.5px solid var(--line-strong);
    color: var(--ink-soft);
  }

  .btn.primary {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--on-accent);
  }

  .btn.primary:disabled {
    background: var(--line-strong);
    border-color: var(--line-strong);
    color: var(--muted);
    cursor: not-allowed;
  }

  .btn:not(.primary):hover {
    background: var(--canvas);
  }
`;

interface Group {
  name: string;
  count: number;
}

function buildModal(
  profile: ProfileData,
  groups: Group[],
  onClose: () => void
): DocumentFragment {
  const fragment = document.createDocumentFragment();

  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const card = document.createElement("div");
  card.className = "card";

  const head = document.createElement("div");
  head.className = "head";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  if (profile.photoUrl) {
    avatar.style.backgroundImage = `url(${JSON.stringify(profile.photoUrl).slice(1, -1)})`;
  }

  const headText = document.createElement("div");
  headText.className = "head-text";
  const headTitle = document.createElement("div");
  headTitle.className = "head-title";
  headTitle.textContent = "Save to a list";
  const headName = document.createElement("div");
  headName.className = "head-name";
  headName.textContent = profile.name || "Unknown profile";
  headText.append(headTitle, headName);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "close-btn";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.innerHTML =
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4l8 8M12 4l-8 8"/></svg>';
  closeBtn.addEventListener("click", onClose);

  head.append(avatar, headText, closeBtn);

  const groupList = document.createElement("div");
  groupList.className = "group-list";

  let selectedIndex: number | null = groups.length > 0 ? 0 : null;

  function renderGroupRows(): void {
    groupList.innerHTML = "";

    if (groups.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No lists yet — create one below.";
      groupList.appendChild(empty);
      return;
    }

    groups.forEach((group, index) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className =
        index === selectedIndex ? "group-row selected" : "group-row";

      const radio = document.createElement("div");
      radio.className = "radio";
      const dot = document.createElement("div");
      dot.className = "dot";
      radio.appendChild(dot);

      const name = document.createElement("div");
      name.className = "gname";
      name.textContent = group.name;

      const count = document.createElement("div");
      count.className = "gcount";
      count.textContent = String(group.count);

      row.append(radio, name, count);
      row.addEventListener("click", () => {
        selectedIndex = index;
        renderGroupRows();
        updateSaveState();
      });

      groupList.appendChild(row);
    });
  }

  const newGroupRow = document.createElement("div");
  newGroupRow.className = "new-group-row";
  const newGroupInput = document.createElement("input");
  newGroupInput.type = "text";
  newGroupInput.placeholder = "New list name…";
  const plusBtn = document.createElement("button");
  plusBtn.type = "button";
  plusBtn.className = "plus-btn";
  plusBtn.textContent = "+ Create";
  plusBtn.addEventListener("click", () => {
    const name = newGroupInput.value.trim();
    if (!name) return;
    groups.push({ name, count: 0 });
    selectedIndex = groups.length - 1;
    newGroupInput.value = "";
    renderGroupRows();
    updateSaveState();
  });
  newGroupRow.append(newGroupInput, plusBtn);

  const foot = document.createElement("div");
  foot.className = "foot";
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "btn";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", onClose);

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "btn primary";
  saveBtn.textContent = "Save to list";
  saveBtn.addEventListener("click", () => {
    if (selectedIndex === null) return;
    const target = groups[selectedIndex];
    if (!target) return;
    // Step 2 is UI-only — no persistence yet. Step 3 wires this to
    // chrome.storage.local.
    console.log("[LinkedIn Group Lister] would save profile to group:", {
      profile,
      group: target.name,
    });
    onClose();
  });

  function updateSaveState(): void {
    saveBtn.disabled = selectedIndex === null;
  }

  foot.append(cancelBtn, saveBtn);

  card.append(head, groupList, newGroupRow, foot);
  overlay.appendChild(card);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) onClose();
  });

  renderGroupRows();
  updateSaveState();

  fragment.appendChild(overlay);
  return fragment;
}

export function openAddToGroupModal(profile: ProfileData): void {
  if (document.getElementById(HOST_ID)) return;

  const host = document.createElement("div");
  host.id = HOST_ID;
  if (isDarkMode()) host.classList.add("dark");
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = MODAL_STYLES;
  shadow.appendChild(style);

  function close(): void {
    host.remove();
    document.removeEventListener("keydown", handleKeydown);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") close();
  }

  const groups = FAKE_GROUPS.map((g) => ({ ...g }));
  shadow.appendChild(buildModal(profile, groups, close));

  document.addEventListener("keydown", handleKeydown);
  document.body.appendChild(host);
}
