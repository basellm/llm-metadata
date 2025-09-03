// Runtime allowlist for model override fields
// Keep runtime config out of type declarations; colocate constants here
export const ALLOWED_MODEL_OVERRIDE_KEYS = [
    'id',
    'name',
    'description',
    'tags',
    'icon', // Usually a string for lobeicon
    'iconURL',
    'reasoning',
    'tool_call',
    'attachment',
    'temperature',
    'modalities',
    'limit',
    'cost',
];
export const ALLOWED_MODEL_OVERRIDE_KEY_SET = new Set(ALLOWED_MODEL_OVERRIDE_KEYS);
//# sourceMappingURL=override-keys.js.map