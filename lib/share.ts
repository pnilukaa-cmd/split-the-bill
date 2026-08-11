import LZString from "lz-string";
import { Assignments, ItemWeights, ParsedReceipt, Person } from "./types";
import { PayoutHandles } from "./payout";

export interface SharePayload {
  receipt: ParsedReceipt;
  people: Person[];
  assignments: Assignments;
  itemWeights: ItemWeights;
  /** The organizer's own Venmo/PayPal handle, if they set one before sharing. */
  organizerPayouts?: PayoutHandles;
}

const HASH_KEY = "s=";
// lz-string's URI-component alphabet never contains "&", so this can't collide with the payload.
const PERSON_SEP = "&p=";

export function encodeShareState(payload: SharePayload): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

export function decodeShareState(encoded: string): SharePayload | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.receipt?.items) || !Array.isArray(parsed.people)) return null;
    return {
      receipt: parsed.receipt,
      people: parsed.people,
      assignments: parsed.assignments ?? {},
      itemWeights: parsed.itemWeights ?? {},
      organizerPayouts: parsed.organizerPayouts ?? undefined,
    };
  } catch {
    return null;
  }
}

/** Builds a self-contained link: the whole split lives in the URL hash, nothing is sent to a server. */
export function buildShareUrl(payload: SharePayload, personId?: string): string {
  const encoded = encodeShareState(payload);
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = personId ? `${HASH_KEY}${encoded}${PERSON_SEP}${encodeURIComponent(personId)}` : `${HASH_KEY}${encoded}`;
  return url.toString();
}

export function parseShareHash(hash: string): { payload: SharePayload; personId: string | null } | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw.startsWith(HASH_KEY)) return null;
  const rest = raw.slice(HASH_KEY.length);
  const splitIdx = rest.indexOf(PERSON_SEP);
  const encoded = splitIdx === -1 ? rest : rest.slice(0, splitIdx);
  const personId = splitIdx === -1 ? null : decodeURIComponent(rest.slice(splitIdx + PERSON_SEP.length));

  const payload = decodeShareState(encoded);
  if (!payload) return null;
  return { payload, personId };
}
