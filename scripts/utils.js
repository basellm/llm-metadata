'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function ensureDirSync(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function readJSONSafe(filePath, fallback) {
    try {
        if (!fs.existsSync(filePath)) return fallback;
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        return fallback;
    }
}

function stableStringify(value) {
    const seen = new WeakSet();
    const sorter = (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (seen.has(obj)) return obj;
        seen.add(obj);
        if (Array.isArray(obj)) {
            return obj.map(sorter);
        }
        const out = {};
        Object.keys(obj).sort().forEach((k) => {
            out[k] = sorter(obj[k]);
        });
        return out;
    };
    return JSON.stringify(sorter(value), null, 2) + '\n';
}

function deepMerge(base, override) {
    if (override === undefined) return base;
    if (base === null || typeof base !== 'object') return override;
    if (override === null || typeof override !== 'object') return override;
    if (Array.isArray(base) && Array.isArray(override)) {
        // Override arrays by replacement (clearer semantics for config)
        return override.slice();
    }
    const result = { ...base };
    for (const key of Object.keys(override)) {
        result[key] = deepMerge(base[key], override[key]);
    }
    return result;
}

function sha256OfObject(value) {
    const hash = crypto.createHash('sha256');
    hash.update(stableStringify(value));
    return hash.digest('hex');
}

function writeJSONIfChanged(filePath, value, options = {}) {
    const { dryRun = false } = options;
    const next = stableStringify(value);
    const exists = fs.existsSync(filePath);
    const prev = exists ? fs.readFileSync(filePath, 'utf8') : null;
    const isChanged = !exists || prev !== next;
    if (!dryRun && isChanged) {
        ensureDirSync(path.dirname(filePath));
        fs.writeFileSync(filePath, next, 'utf8');
    }
    return isChanged;
}

function readJSONIfExists(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        const txt = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(txt);
    } catch (e) {
        return null;
    }
}

function parseArgv(argv) {
    const args = {};
    for (let i = 2; i < argv.length; i += 1) {
        const token = argv[i];
        if (!token.startsWith('--')) continue;
        const [k, v] = token.slice(2).split('=');
        if (v === undefined) {
            args[k] = true;
        } else {
            args[k] = v;
        }
    }
    return args;
}

function copyDirSyncIfExists(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) return false;
    ensureDirSync(destDir);
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            copyDirSyncIfExists(srcPath, destPath);
        } else if (entry.isFile()) {
            ensureDirSync(path.dirname(destPath));
            fs.copyFileSync(srcPath, destPath);
        }
    }
    return true;
}

// Sanitize a filename segment for cross-platform (Windows/macOS/Linux)
// - Disallow: <>:"/\|?* and control chars
// - Replace with '-'
// - Trim trailing dots/spaces
// - Keep letters, numbers, dash, underscore, dot
function sanitizeFileSegment(name) {
    const INVALID_RE = /[<>:"/\\|?*\u0000-\u001F]/g;
    let out = String(name).replace(INVALID_RE, '-');
    // Collapse multiple '-'
    out = out.replace(/-{2,}/g, '-');
    // Remove trailing spaces or dots which are invalid on Windows
    out = out.replace(/[ .]+$/g, '');
    // Avoid empty name
    if (!out) out = 'unnamed';
    // Cap at a safe length
    if (out.length > 200) out = out.slice(0, 200);
    return out;
}

function removeNonJsonFiles(dirPath, options = {}) {
    const { dryRun = false } = options;
    if (!fs.existsSync(dirPath)) return { removed: 0 };
    let removed = 0;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dirPath, entry.name);
        if (entry.isDirectory()) continue;
        if (!entry.name.toLowerCase().endsWith('.json')) {
            if (!dryRun) {
                try { fs.unlinkSync(full); removed += 1; } catch { }
            } else {
                removed += 1;
            }
        }
    }
    return { removed };
}

module.exports = {
    ensureDirSync,
    readJSONSafe,
    stableStringify,
    deepMerge,
    sha256OfObject,
    writeJSONIfChanged,
    readJSONIfExists,
    parseArgv,
    copyDirSyncIfExists,
    sanitizeFileSegment,
    removeNonJsonFiles,
};


