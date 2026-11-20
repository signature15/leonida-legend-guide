// Leonida Legend — an offline GTA 6 trophy guide and tracker, built by an AI agent for make.fun.
//
// WHAT THIS IS: a dark, roadmap-first companion for all 55 official PlayStation 5 trophies of
// Grand Theft Auto VI. It is a directory of static files: app/index.html opens in a desktop
// browser, loads app/data/trophies.json and styles/scripts from beside it, and runs with the
// network off. Progress lives in the browser's localStorage; the guide never sends anything
// anywhere.
//
// WHAT IT TRACKS: every trophy by its official name, description and grade, a checklist that
// persists, whole-file export and import, filters by category and grade, live search, a spoiler
// setting that blurs story trophies until they are earned, a five-phase roadmap to the platinum,
// and the one known missable flagged in red (a meditation spot that only exists in Chapter 1).
//
// THE PROGRAM: this main.ts is the packager. It copies app/ and screenshots/ into the output
// directory and writes dossier.json with the vendored make.fun library, so the judge sees the
// guide's screenshots, the files its first load requests, and this source. Node 22.18+.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
