import type { ProfileData } from "./content";

export interface Group {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  groupId: string;
  name: string | null;
  photoUrl: string | null;
  profileUrl: string;
  addedAt: number;
}

interface StoreShape {
  groups: Group[];
  members: Member[];
}

const STORAGE_KEY = "lgl_store";

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readStore(): Promise<StoreShape> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const store = result[STORAGE_KEY] as StoreShape | undefined;
  return store ?? { groups: [], members: [] };
}

async function writeStore(store: StoreShape): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: store });
}

export interface GroupWithCount extends Group {
  memberCount: number;
}

export async function getGroups(): Promise<GroupWithCount[]> {
  const store = await readStore();
  return store.groups.map((group) => ({
    ...group,
    memberCount: store.members.filter((m) => m.groupId === group.id).length,
  }));
}

export async function createGroup(name: string): Promise<Group> {
  const store = await readStore();
  const group: Group = { id: makeId(), name };
  store.groups.push(group);
  await writeStore(store);
  return group;
}

// Duplicate check: which groups (by name) already contain this profileUrl,
// anywhere in the store — not just the group being saved to.
export async function findGroupsContainingProfile(
  profileUrl: string
): Promise<Group[]> {
  const store = await readStore();
  const groupIds = new Set(
    store.members
      .filter((m) => m.profileUrl === profileUrl)
      .map((m) => m.groupId)
  );
  return store.groups.filter((g) => groupIds.has(g.id));
}

export type AddMemberResult =
  | { status: "added" }
  | { status: "already-in-target-group" };

export async function addMemberToGroup(
  groupId: string,
  profile: ProfileData
): Promise<AddMemberResult> {
  const store = await readStore();

  const alreadyInTarget = store.members.some(
    (m) => m.groupId === groupId && m.profileUrl === profile.profileUrl
  );
  if (alreadyInTarget) {
    return { status: "already-in-target-group" };
  }

  const member: Member = {
    id: makeId(),
    groupId,
    name: profile.name,
    photoUrl: profile.photoUrl,
    profileUrl: profile.profileUrl,
    addedAt: Date.now(),
  };
  store.members.push(member);
  await writeStore(store);
  return { status: "added" };
}
