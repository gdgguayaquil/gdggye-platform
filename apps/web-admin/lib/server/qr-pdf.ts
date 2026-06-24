import "server-only";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

import {
  signQrToken,
  type Activity,
  type Event,
  type EventSponsor,
  type QrPayload,
  type Sponsor,
} from "@gdggye/backend-core";

function readQrSecret(): string {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "QR_SIGNING_SECRET is missing or too short (need 32+ chars).",
    );
  }
  return secret;
}

async function mintToken(
  type: "sponsor" | "activity",
  eventId: string,
  targetId: string,
  secret: string,
): Promise<string> {
  const payload: QrPayload = {
    t: type,
    e: eventId,
    i: targetId,
    iat: Math.floor(Date.now() / 1000),
  };
  return signQrToken(payload, secret);
}

interface Target {
  type: "sponsor" | "activity";
  id: string;
  title: string;
  subtitle: string; // tier / sponsor name
  detail: string | null; // booth label / points
}

// QR sheet input. A "sponsor target" is now an EventSponsor (the
// attachment) joined with the global Sponsor identity, so the QR encodes
// the global sponsor.id while the printed label can show event-specific
// tier/booth alongside the canonical name.
export interface AttachedSponsorInput {
  attachment: EventSponsor;
  sponsor: Sponsor;
}

function targetsFromInputs(
  attached: AttachedSponsorInput[],
  activities: Activity[],
): Target[] {
  const sponsorName = new Map(
    attached.map(({ sponsor }) => [sponsor.id, sponsor.name]),
  );
  const sponsorTargets: Target[] = attached
    .filter(({ attachment }) => attachment.isActive)
    .map(({ attachment, sponsor }) => ({
      type: "sponsor",
      id: sponsor.id,
      title: sponsor.name,
      subtitle: attachment.tier ? `Sponsor · ${attachment.tier}` : "Sponsor",
      detail: attachment.boothLabel,
    }));
  const activityTargets: Target[] = activities
    .filter((a) => a.isActive)
    .map((a) => ({
      type: "activity",
      id: a.id,
      title: a.name,
      subtitle: `Activity · ${sponsorName.get(a.sponsorId) ?? "—"}`,
      detail: `${a.points} pts`,
    }));
  return [...sponsorTargets, ...activityTargets];
}

// A4 portrait in PDF points (1pt = 1/72 inch). 595.28 × 841.89.
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 36; // 0.5 inch
const COLS = 2;
const ROWS = 3; // 6 QRs per page → fits ~30 targets in 5 pages
const CELL_GAP = 18;

// Render QR as PNG buffer at high error correction so prints survive smudges.
async function renderQrPng(token: string): Promise<Uint8Array> {
  const buffer = await QRCode.toBuffer(token, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: 1,
    scale: 8, // ~~ 8 × matrix-size pixels; for a 33×33 matrix that's 264px square.
    color: { dark: "#1e1e1e", light: "#ffffff" },
  });
  return new Uint8Array(buffer);
}

export async function generateQrSheetPdf(
  event: Event,
  attachedSponsors: AttachedSponsorInput[],
  activities: Activity[],
): Promise<Uint8Array> {
  const secret = readQrSecret();
  const targets = targetsFromInputs(attachedSponsors, activities);

  const doc = await PDFDocument.create();
  doc.setTitle(`${event.name} ${event.year} — QR sheet`);
  doc.setSubject("Booth + activity QRs (signed)");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);

  const innerW = PAGE_W - MARGIN * 2;
  const innerH = PAGE_H - MARGIN * 2 - 48; // header strip on each page
  const cellW = (innerW - CELL_GAP * (COLS - 1)) / COLS;
  const cellH = (innerH - CELL_GAP * (ROWS - 1)) / ROWS;

  // QR is square, fits the cell width minus padding for the text rows below.
  const qrSize = Math.min(cellW - 16, cellH - 96);

  if (targets.length === 0) {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    page.drawText("No active sponsors or activities yet.", {
      x: MARGIN,
      y: PAGE_H - MARGIN - 24,
      size: 12,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  } else {
    const perPage = COLS * ROWS;
    const pageCount = Math.ceil(targets.length / perPage);
    for (let p = 0; p < pageCount; p++) {
      const page = doc.addPage([PAGE_W, PAGE_H]);

      // Header strip
      page.drawText(`${event.name} ${event.year}`, {
        x: MARGIN,
        y: PAGE_H - MARGIN - 14,
        size: 16,
        font: fontBold,
        color: rgb(0.12, 0.12, 0.12),
      });
      page.drawText(
        `QR sheet · page ${p + 1} of ${pageCount} · do not share digitally`,
        {
          x: MARGIN,
          y: PAGE_H - MARGIN - 32,
          size: 9,
          font: mono,
          color: rgb(0.4, 0.4, 0.4),
        },
      );

      const startIdx = p * perPage;
      for (let i = 0; i < perPage && startIdx + i < targets.length; i++) {
        const target = targets[startIdx + i]!;
        const col = i % COLS;
        const row = Math.floor(i / COLS);

        const cellX = MARGIN + col * (cellW + CELL_GAP);
        const cellY = PAGE_H - MARGIN - 48 - (row + 1) * cellH - row * CELL_GAP;

        // Cell border
        page.drawRectangle({
          x: cellX,
          y: cellY,
          width: cellW,
          height: cellH,
          borderColor: rgb(0.85, 0.85, 0.85),
          borderWidth: 0.75,
        });

        // QR
        const token = await mintToken(target.type, event.id, target.id, secret);
        const pngBytes = await renderQrPng(token);
        const png = await doc.embedPng(pngBytes);
        const qrX = cellX + (cellW - qrSize) / 2;
        const qrY = cellY + cellH - qrSize - 12;
        page.drawImage(png, { x: qrX, y: qrY, width: qrSize, height: qrSize });

        // Title
        const titleY = qrY - 22;
        page.drawText(target.title, {
          x: cellX + 12,
          y: titleY,
          size: 13,
          font: fontBold,
          color: rgb(0.12, 0.12, 0.12),
          maxWidth: cellW - 24,
        });
        // Subtitle (type + sponsor/tier)
        page.drawText(target.subtitle, {
          x: cellX + 12,
          y: titleY - 16,
          size: 10,
          font,
          color: rgb(0.35, 0.35, 0.35),
          maxWidth: cellW - 24,
        });
        // Detail (booth label or points)
        if (target.detail) {
          page.drawText(target.detail, {
            x: cellX + 12,
            y: titleY - 32,
            size: 9,
            font: mono,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        // Footer in cell
        page.drawText(`${target.type}:${target.id.slice(0, 8)}`, {
          x: cellX + 12,
          y: cellY + 8,
          size: 7,
          font: mono,
          color: rgb(0.65, 0.65, 0.65),
        });
      }
    }
  }

  return doc.save();
}
