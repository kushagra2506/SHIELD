import fs from 'fs';
import path from 'path';

const re = /\s+dark:[^\s"'`}]+/g;

function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(tsx?|jsx?)$/.test(e.name)) {
            const src = fs.readFileSync(p, 'utf8');
            const out = src.replace(re, '');
            if (out !== src) { fs.writeFileSync(p, out); console.log('cleaned', p); }
        }
    }
}
walk('src');