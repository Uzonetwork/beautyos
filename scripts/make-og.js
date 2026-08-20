import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WIDTH = 1200;
const HEIGHT = 630;

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// ── Background ──────────────────────────────────────────────────────────────
ctx.fillStyle = '#0A2E1A';
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// ── Dot grid ─────────────────────────────────────────────────────────────────
ctx.fillStyle = '#123A22';
for (let y = 0; y <= HEIGHT; y += 28) {
  for (let x = 0; x <= WIDTH; x += 28) {
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Badge ────────────────────────────────────────────────────────────────────
const badgeX = 120, badgeY = 175, badgeSize = 170, badgeR = 36;
ctx.fillStyle = '#F5C842';
roundRect(ctx, badgeX, badgeY, badgeSize, badgeSize, badgeR);
ctx.fill();

ctx.fillStyle = '#0A2E1A';
ctx.font = 'bold 110px Georgia, serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('D', badgeX + badgeSize / 2, badgeY + badgeSize / 2 + 8);

// ── "Danda" wordmark ─────────────────────────────────────────────────────────
const badgeCenterY = badgeY + badgeSize / 2;
ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 120px Georgia, serif';
ctx.textAlign = 'left';
ctx.textBaseline = 'middle';
ctx.fillText('Danda', badgeX + badgeSize + 44, badgeCenterY + 8);

// ── Tagline ──────────────────────────────────────────────────────────────────
ctx.fillStyle = '#7AAE90';
ctx.font = '34px Arial, sans-serif';
ctx.textAlign = 'left';
ctx.textBaseline = 'alphabetic';
ctx.fillText('Booking pages for Nigerian professionals', 122, badgeY + badgeSize + 70);

// ── Category pills ───────────────────────────────────────────────────────────
const pills = ['Nail Techs', 'Photographers', 'Tailors', 'DJs', 'Chefs', '+ more'];
const pillY = 520, pillH = 46, pillGap = 14, pillPadX = 24;
ctx.font = '22px Arial, sans-serif';
let cursorX = 122;
for (const label of pills) {
  const textW = ctx.measureText(label).width;
  const pillW = textW + pillPadX * 2;

  ctx.fillStyle = '#0F3D22';
  roundRect(ctx, cursorX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();

  ctx.strokeStyle = '#1A5C30';
  ctx.lineWidth = 2;
  roundRect(ctx, cursorX, pillY, pillW, pillH, pillH / 2);
  ctx.stroke();

  ctx.fillStyle = '#4CAF72';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cursorX + pillPadX, pillY + pillH / 2 + 1);

  cursorX += pillW + pillGap;
}

// ── Domain label, top right ─────────────────────────────────────────────────
ctx.fillStyle = '#F5C842';
ctx.font = 'bold 28px Arial, sans-serif';
ctx.textAlign = 'right';
ctx.textBaseline = 'top';
ctx.fillText('danda.ng', WIDTH - 60, 60);

// ── Write file ───────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, '..', 'public', 'og-image.png');
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log(`Wrote ${outPath} (${canvas.width}x${canvas.height})`);
