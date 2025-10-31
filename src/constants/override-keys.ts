// Runtime allowlist for model override fields
// Keep runtime config out of type declarations; colocate constants here

export const ALLOWED_MODEL_OVERRIDE_KEYS = [
  'id',
  'name',
  'description',
  'reasoning',
  'tool_call',
  'attachment',
  'temperature',
  'knowledge',
  'release_date',
  'last_updated',
  'open_weights',
  'modalities',
  'limit',
  'cost',
  'currency',
] as const;

export type AllowedModelOverrideKey = (typeof ALLOWED_MODEL_OVERRIDE_KEYS)[number];

export const ALLOWED_MODEL_OVERRIDE_KEY_SET: ReadonlySet<string> = new Set(
  ALLOWED_MODEL_OVERRIDE_KEYS as readonly string[],
);
