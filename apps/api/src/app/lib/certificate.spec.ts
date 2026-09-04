import { PDFDocument } from 'pdf-lib';
import { createCertificatePdf } from './certificate';

describe('certificate PDF', () => {
  it('creates a single-page PDF', async () => {
    const bytes = await createCertificatePdf({
      id: 'certificate-id',
      serialCode: 'DC-2026-ABCDEFGHIJKL',
      learnerName: 'Ada Lovelace',
      courseTitle: 'JavaScript Fundamentals',
      issuedAt: '2026-09-03T00:00:00.000Z',
    });
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBe(1);
  });
});
