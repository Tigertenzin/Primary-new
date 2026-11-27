/*  Generates src/scss/10_foundations/palettes/_palettes.scss
    Run with:  npm run palettes   (then npm run build)

    Each alternative palette is described by a handful of its own colours per
    mode. Everything else is derived the same way for every palette:

    - Grey steps: Primary's 14 greys are placed between the palette's anchor
      colours (lightest surface, background, text, strongest text) at the same
      OKLab lightness spacing Primary Classic uses, so contrast between
      background, borders and text stays like Primary's.
    - Colour scales: each palette colour becomes the main step of its scale
      (nudged until it reads on the background), and the other steps keep
      Primary's lightness offsets around it.
    - Buttons use the palette's accent, darkened if needed so the button text
      stays readable.
    - Callouts, alternative checkboxes and Obsidian's standard colours (canvas,
      graph) are mapped onto the palette's colours, since Primary hardcodes them.

    A palette is switched on with the body class `palette-<name>`, which the
    Style Settings "Palette" option sets. Style Settings colour overrides still
    win, because Style Settings' own CSS loads after the theme. */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLASSIC = fs.readFileSync(path.join(ROOT, 'src/scss/10_foundations/palettes/_classic-original.scss'), 'utf8');
const OUT = path.join(ROOT, 'src/scss/10_foundations/palettes/_palettes.scss');

/*  Palette definitions. Per mode:
      s0   lightest surface (light) / darkest surface (dark), e.g. cards, tables
      bg   main background
      fg   normal text
      fg0  strongest text (headings)
      red orange yellow green cyan blue purple pink
      accent   button colour                                              */
export const PALETTES = {
    everforest: {
        label: 'Everforest',
        light: { s0: '#fffbef', bg: '#fdf6e3', fg: '#5c6a72', fg0: '#384148',
                 red: '#f85552', orange: '#f57d26', yellow: '#dfa000', green: '#8da101',
                 cyan: '#35a77c', blue: '#3a94c5', purple: '#df69ba', pink: '#df69ba',
                 accent: '#8da101' },
        dark:  { s0: '#232a2e', bg: '#2d353b', fg: '#d3c6aa', fg0: '#e7dcc4',
                 red: '#e67e80', orange: '#e69875', yellow: '#dbbc7f', green: '#a7c080',
                 cyan: '#83c092', blue: '#7fbbb3', purple: '#d699b6', pink: '#d699b6',
                 accent: '#a7c080' },
    },
    rosepine: {
        label: 'Rosé Pine',
        // its orange is a pink-rose; warnings use gold, as Rosé Pine itself does
        warning: 'yellow',
        // Rosé Pine has no green: pine (teal) stands in for it, foam for blue
        light: { s0: '#fffaf3', bg: '#faf4ed', fg: '#575279', fg0: '#464261',
                 red: '#b4637a', orange: '#d7827e', yellow: '#ea9d34', green: '#286983',
                 cyan: '#56949f', blue: '#56949f', purple: '#907aa9', pink: '#d7827e',
                 accent: '#907aa9' },
        dark:  { s0: '#13111e', bg: '#191724', fg: '#e0def4', fg0: '#f2f0ff',
                 red: '#eb6f92', orange: '#ebbcba', yellow: '#f6c177', green: '#31748f',
                 cyan: '#9ccfd8', blue: '#9ccfd8', purple: '#c4a7e7', pink: '#ebbcba',
                 accent: '#c4a7e7' },
    },
};

/*────────── colour maths ──────────*/
const hex2rgb = h => [0, 2, 4].map(i => parseInt(h.replace('#', '').slice(i, i + 2), 16) / 255);
const lin = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const unlin = c => c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
function rgb2lab([r, g, b]) {
    [r, g, b] = [r, g, b].map(lin);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function lab2rgb([L, a, b]) {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    return [ 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s]
        .map(c => Math.min(1, Math.max(0, unlin(Math.max(0, c)))));
}
const mix = (A, B, t) => A.map((v, i) => v + (B[i] - v) * t);
function rgb2hsl([r, g, b]) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    let h = 0, s = 0;
    if (mx !== mn) {
        const d = mx - mn;
        s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h *= 60;
    }
    return [h, s * 100, l * 100];
}
function hsl2rgb([h, s, l]) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    return [0, 8, 4].map(n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)));
}
const hsla = (rgb, a = 1) => { const [h, s, l] = rgb2hsl(rgb); return `hsla(${h.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%, ${a})`; };
const rgbFn = rgb => `rgb(${rgb.map(c => Math.round(c * 255)).join(', ')})`;
const triplet = rgb => rgb.map(c => Math.round(c * 255)).join(', ');
const lum = rgb => { const [r, g, b] = rgb.map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (x, y) => { const a = lum(x), b = lum(y); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };

/*────────── Primary Classic's own steps ──────────*/
function classicSteps(mode) {
    const o = {};
    for (const m of CLASSIC.matchAll(new RegExp(`--color-${mode}-([a-z]+)-(\\d+): (hsla?\\([^)]*\\))`, 'g'))) {
        const [h, s, l] = m[3].match(/[\d.]+/g).map(Number);
        (o[m[1]] ||= {})[m[2]] = rgb2lab(hsl2rgb([h, s, l]))[0];
    }
    return o;
}
const CLASSIC_L = { l: classicSteps('l'), d: classicSteps('d') };

const ANCHORS = { l: { 10: 's0', 20: 'bg', 130: 'fg', 140: 'fg0' },
                  d: { 140: 's0', 100: 'bg', 20: 'fg', 10: 'fg0' } };
const MAIN_STEP = { l: 30, d: 20 };
const HUES = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

function build(pal, mode, opts = {}) {
    const A = Object.fromEntries(Object.entries(pal).map(([k, v]) => [k, rgb2lab(hex2rgb(v))]));
    const out = {};
    const gl = CLASSIC_L[mode].gray;
    const steps = Object.keys(gl).map(Number);
    const anchors = Object.entries(ANCHORS[mode]).map(([s, n]) => [Number(s), n]).sort((a, b) => gl[a[0]] - gl[b[0]]);

    // Greys
    const grey = {};
    for (const s of steps.sort((a, b) => a - b)) {
        const L = gl[s];
        let lo = anchors[0], hi = anchors[anchors.length - 1];
        for (let i = 0; i < anchors.length - 1; i++)
            if (L >= gl[anchors[i][0]] && L <= gl[anchors[i + 1][0]]) { lo = anchors[i]; hi = anchors[i + 1]; }
        const t = Math.min(1, Math.max(0, (L - gl[lo[0]]) / ((gl[hi[0]] - gl[lo[0]]) || 1)));
        grey[s] = lab2rgb(mix(A[lo[1]], A[hi[1]], t));
        out[`--color-${mode}-gray-${s}`] = hsla(grey[s]);
    }
    const bg = grey[mode === 'l' ? 20 : 100];
    const onAccent = grey[mode === 'l' ? 10 : 10];
    out[`--color-${mode}-alpha-gray`] = hsla(grey[mode === 'l' ? 70 : 50], mode === 'l' ? 0.15 : 0.2);

    // Colour scales
    const main = {};
    const readable = (lab, min = 4.5) => {
        let X = lab;
        for (let i = 0; i < 80 && contrast(lab2rgb(X), bg) < min; i++) X = [X[0] + (mode === 'l' ? -0.01 : 0.01), X[1], X[2]];
        return X;
    };
    for (const h of HUES) {
        const X = readable(A[h]);
        main[h] = lab2rgb(X);
        const cl = CLASSIC_L[mode][h], Lm = cl[MAIN_STEP[mode]];
        for (const s of Object.keys(cl)) out[`--color-${mode}-${h}-${s}`] = hsla(lab2rgb([X[0] + (cl[s] - Lm), X[1], X[2]]));
        out[`--color-${mode}-alpha-${h}`] = hsla(main[h], 0.2);
    }
    main.cyan = lab2rgb(readable(A.cyan));
    main.pink = lab2rgb(readable(A.pink));
    main.gray = grey[mode === 'l' ? 80 : 50];

    // Obsidian's standard colours (callouts fall back to these, canvas, graph)
    for (const k of ['gray', 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink']) {
        out[`--color-${k}-rgb`] = triplet(main[k]);
        out[`--color-${k}`] = hsla(main[k]);
    }

    // Selected items in lists (Primary: a translucent dark blue)
    out['--nav-item-background-selected'] = hsla(lab2rgb(mix(rgb2lab(main.blue), [0, 0, 0], 0.35)), 0.5);
    out['--nav-item-background-selected-hover'] = hsla(lab2rgb(mix(rgb2lab(main.blue), [0, 0, 0], 0.35)), 0.4);

    // Callouts: Primary's own choices, moved onto the palette's colours
    const soft = c => lab2rgb(mix(rgb2lab(c), rgb2lab(grey[mode === 'l' ? 70 : 50]), 0.45));
    const callouts = {
        general: soft(main.cyan), note: soft(main.orange), summary: main.yellow, abstract: main.blue,
        tldr: main.pink, info: main.blue, todo: main.blue, tip: main.cyan, hint: main.cyan,
        important: main.red, success: main.green, check: main.green, done: main.green,
        question: main.blue, help: main.orange, faq: main.blue,
        warning: main[opts.warning || 'orange'], caution: main[opts.warning || 'orange'], attention: main[opts.warning || 'orange'],
        fail: main.red, missing: main.red, danger: main.red, error: main.red,
        bug: main.purple, example: soft(main.red), quote: soft(main.green), cite: soft(main.yellow),
    };
    for (const [k, c] of Object.entries(callouts)) out[`--callout-rgb-${k}`] = rgbFn(c);

    // Alternative checkboxes
    const boxes = {
        inprogress: main.yellow, resched: main.cyan, sched: main.gray, important: main.orange,
        cancelled: main.gray, question: main.purple, star: main.yellow, note: main.red,
        location: main.red, info: main.cyan, amount: main.green, quote: main.blue, idea: main.orange,
        pro: main.green, con: main.red, bookmark: main.orange, fire: main.orange, clock: main.blue,
        down: main.red, up: main.green, key: main.yellow, law: main.purple, language: main.blue,
        telephone: main.cyan, win: main.yellow,
    };
    for (const [k, c] of Object.entries(boxes)) out[`--${k}-chbx-color`] = hsla(c);
    out['--inprogress-chbx-color-hover'] = hsla(lab2rgb(mix(rgb2lab(main.yellow), [1, 0, 0], 0.15)));

    // Delete/warning buttons: Primary paints them with red-30 and the button
    // text colour. Pastel reds (most dark palettes) are too light for that,
    // so darken the red until the text reads, hover a step lighter.
    let err = rgb2lab(hex2rgb(pal.red));
    while (err[0] > 0.2 && contrast(lab2rgb(err), onAccent) < 3.5) err = [err[0] - 0.01, err[1], err[2]];
    out['--background-modifier-error'] = hsla(lab2rgb(err));
    out['--background-modifier-error-hover'] = hsla(lab2rgb([err[0] + 0.05, err[1], err[2]]));

    // Buttons: Primary derives the button colour (accent-1) from these numbers
    // as hsl(h - 1, s * 1.01, l * 1.075). Darken the accent until the button
    // text (gray-10) reads on that.
    let [h, s, l] = rgb2hsl(hex2rgb(pal.accent));
    const button = () => hsl2rgb([h - 1, Math.min(100, s * 1.01), Math.min(100, l * 1.075)]);
    while (l > 5 && contrast(button(), onAccent) < 3.5) l -= 1;
    out['--accent-h'] = h.toFixed(0);
    out['--accent-s'] = s.toFixed(0) + '%';
    out['--accent-l'] = l.toFixed(0) + '%';

    return out;
}

let scss = `/*────────── Alternative Palettes ──────────*/

/*  GENERATED by tools/palettes.mjs — edit the palette definitions there and
    run \`npm run palettes\`, don't edit this file by hand.

    Each palette replaces Primary Classic's base colours (greys, colour
    scales, accent, callout and checkbox colours); everything else in the
    theme is built from those, so it follows automatically. Switched on by
    the Style Settings "Palette" option (body class palette-<name>). */
`;
for (const [name, p] of Object.entries(PALETTES)) {
    for (const [mode, key] of [['l', 'light'], ['d', 'dark']]) {
        const vars = build(p[key], mode, p);
        scss += `\n/* ${p.label}, ${key} */\nbody.theme-${key}.palette-${name} {\n`;
        scss += Object.entries(vars).map(([k, v]) => `    ${k}: ${v};`).join('\n') + '\n}\n';
    }
}
fs.writeFileSync(OUT, scss);
console.log(`wrote ${path.relative(ROOT, OUT)} (${Object.keys(PALETTES).join(', ')})`);
