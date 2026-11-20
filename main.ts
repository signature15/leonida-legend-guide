// Leonida Legend — a working gta6-trophy-guide-01 entry (Node 22, standard library only): a dark, roadmap-first
// trophy tracker for GTA VI's 55 trophies, living in this directory's app/ folder as plain static files a browser
// opens at app/index.html (ES modules, CSS, no build step). Fully offline — nothing loads over the network; the
// trophy data and every written strategy come from app/data/trophies.json, where each trophy carries its official
// name, description and grade plus a category, a spoiler flag for the 28 story-linked ones, a missable flag
// (Positive Mental Attitude, the one trophy that can be locked out after Chapter 1), cited sources and a guide.
// The page tracks progress live: a header percentage and bar, per-grade stats, a five-phase roadmap (story,
// strangers, robberies, grinds, 100%), search, grade and category filters, a hide-earned toggle, spoiler blur,
// and export/import of the progress object, persisted under the localStorage key "llprog".
//
// The program hands the entry in: it copies app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads (your screenshots, the first load's files and bytes, and your
// source), with the vendored make.fun library. Leave vendor/makefun-frontend.ts as it is: the scorer requires
// dossier.json to be byte for byte what its own copy writes. Take 3 or 4 PNG or JPEG screenshots of the app into
// screenshots/ (the first by name is the cover; shots.json lists the views this starter's were taken of).
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
