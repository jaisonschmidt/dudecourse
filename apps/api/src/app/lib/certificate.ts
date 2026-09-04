import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { CertificateDto } from '@dudecourse/shared/domain';

function printable(value: string): string {
  return value.normalize('NFKD').replace(/[^\x20-\x7E]/g, '');
}

function centeredX(width: number, textWidth: number): number {
  return Math.max(40, (width - textWidth) / 2);
}

export async function createCertificatePdf(certificate: CertificateDto): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const page = document.addPage([842, 595]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const teal = rgb(0.059, 0.463, 0.431);
  const coral = rgb(0.976, 0.451, 0.376);
  const ink = rgb(0.086, 0.196, 0.31);
  const cream = rgb(1, 0.973, 0.929);

  page.drawRectangle({ x: 0, y: 0, width, height, color: cream });
  page.drawRectangle({
    x: 22,
    y: 22,
    width: width - 44,
    height: height - 44,
    borderColor: teal,
    borderWidth: 4,
  });
  page.drawCircle({ x: 92, y: height - 92, size: 34, color: teal });
  page.drawText('D', { x: 80, y: height - 104, size: 34, font: bold, color: cream });
  page.drawCircle({ x: 122, y: height - 66, size: 7, color: coral });
  page.drawText('DUDE COURSE', { x: 145, y: height - 98, size: 18, font: bold, color: ink });

  const heading = 'CERTIFICATE OF COMPLETION';
  page.drawText(heading, {
    x: centeredX(width, bold.widthOfTextAtSize(heading, 31)),
    y: 390,
    size: 31,
    font: bold,
    color: ink,
  });
  const intro = 'This certifies that';
  page.drawText(intro, {
    x: centeredX(width, regular.widthOfTextAtSize(intro, 16)),
    y: 340,
    size: 16,
    font: regular,
    color: ink,
  });

  const learnerName = printable(certificate.learnerName);
  const learnerSize = Math.min(34, Math.max(20, 720 / Math.max(learnerName.length, 1)));
  page.drawText(learnerName, {
    x: centeredX(width, bold.widthOfTextAtSize(learnerName, learnerSize)),
    y: 285,
    size: learnerSize,
    font: bold,
    color: teal,
  });

  const courseLine = `completed ${printable(certificate.courseTitle)}`;
  const courseSize = Math.min(23, Math.max(15, 700 / Math.max(courseLine.length, 1)));
  page.drawText(courseLine, {
    x: centeredX(width, regular.widthOfTextAtSize(courseLine, courseSize)),
    y: 235,
    size: courseSize,
    font: regular,
    color: ink,
  });

  const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(certificate.issuedAt)
  );
  page.drawText(`Issued ${date}`, { x: 80, y: 92, size: 13, font: regular, color: ink });
  page.drawText(`Verification code: ${certificate.serialCode}`, {
    x: width - 340,
    y: 92,
    size: 13,
    font: regular,
    color: ink,
  });

  return document.save();
}
