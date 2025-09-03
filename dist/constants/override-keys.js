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
];
export const ALLOWED_MODEL_OVERRIDE_KEY_SET = new Set(ALLOWED_MODEL_OVERRIDE_KEYS);
//# sourceMappingURL=override-keys.js.map