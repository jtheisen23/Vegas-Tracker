import { useRef, useState } from 'react';
import {
  RoundExportData,
  formatRoundSummary,
  emailSummary,
  textSummary,
  copySummary,
  generatePDFBlob,
  sharePDF,
} from '../utils/export';
import PrintableSummary from './PrintableSummary';

const hasWebShareFiles = (): boolean => {
  const nav = navigator as any;
  return typeof nav.share === 'function';
};

interface Props {
  data: RoundExportData;
  label?: string;
}

export default function ShareMenu({ data, label = 'Share Round Summary' }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const subject = `Vegas Golf - ${data.courseName || 'Round'} ${new Date(data.date).toLocaleDateString()}`;
  const pdfFilename = `vegas-golf-${(data.courseName || 'round').replace(/\s+/g, '-').toLowerCase()}-${new Date(data.date).toISOString().split('T')[0]}.pdf`;

  const getText = () => formatRoundSummary(data);

  const showStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 3000);
  };

  // Shared PDF flow: generate PDF then open the native share sheet.
  const doPDFShare = async (): Promise<'shared' | 'downloaded' | 'failed'> => {
    if (!printableRef.current) return 'failed';
    setGeneratingPDF(true);
    try {
      const blob = await generatePDFBlob(printableRef.current);
      return await sharePDF(blob, pdfFilename, subject);
    } catch (err) {
      console.error(err);
      return 'failed';
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleShare = async () => {
    showStatus('Generating PDF…');
    const res = await doPDFShare();
    if (res === 'shared') showStatus('Shared!');
    else if (res === 'downloaded') showStatus('Downloaded PDF');
    else showStatus('Share failed');
  };

  // Email / Text: prefer PDF via share sheet (so user can pick Mail or Messages).
  // If Web Share API is unavailable (e.g. desktop), fall back to mailto:/sms:
  // with plain text — since those URI schemes can't carry attachments.
  const handleEmail = async () => {
    if (hasWebShareFiles()) {
      showStatus('Generating PDF…');
      const res = await doPDFShare();
      if (res === 'shared') showStatus('Shared!');
      else if (res === 'downloaded') showStatus('Downloaded PDF');
      else emailSummary(getText(), subject);
    } else {
      emailSummary(getText(), subject);
    }
  };

  const handleText = async () => {
    if (hasWebShareFiles()) {
      showStatus('Generating PDF…');
      const res = await doPDFShare();
      if (res === 'shared') showStatus('Shared!');
      else if (res === 'downloaded') showStatus('Downloaded PDF');
      else textSummary(getText());
    } else {
      textSummary(getText());
    }
  };

  const handleCopy = async () => {
    const ok = await copySummary(getText());
    showStatus(ok ? 'Copied text to clipboard' : 'Copy failed');
  };

  return (
    <div className="bg-neutral-900 rounded-xl p-3">
      <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={handleShare}
          disabled={generatingPDF}
          className="bg-red-600 disabled:bg-neutral-700 text-white rounded-lg py-2 text-xs font-semibold flex flex-col items-center gap-0.5"
        >
          <span className="text-base">📤</span>
          Share PDF
        </button>
        <button
          onClick={handleEmail}
          className="bg-neutral-800 text-white rounded-lg py-2 text-xs font-semibold flex flex-col items-center gap-0.5"
        >
          <span className="text-base">📧</span>
          Email
        </button>
        <button
          onClick={handleText}
          className="bg-neutral-800 text-white rounded-lg py-2 text-xs font-semibold flex flex-col items-center gap-0.5"
        >
          <span className="text-base">💬</span>
          Text
        </button>
        <button
          onClick={handleCopy}
          className="bg-neutral-800 text-white rounded-lg py-2 text-xs font-semibold flex flex-col items-center gap-0.5"
        >
          <span className="text-base">📋</span>
          Copy
        </button>
      </div>
      <div className="text-[10px] text-neutral-500 mt-2 text-center">
        PDF goes through your device's share sheet — pick Mail, Messages, or any app.
      </div>
      {status && <div className="mt-2 text-xs text-yellow-400 text-center">{status}</div>}

      {/* Off-screen printable summary used for PDF capture */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: -10000,
          zIndex: -1,
          pointerEvents: 'none',
          opacity: 0,
        }}
        aria-hidden
      >
        <PrintableSummary ref={printableRef} data={data} />
      </div>
    </div>
  );
}
