import { useEffect, useRef, useState } from 'react';
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

// Verify the browser can actually share a PDF file (not just that `share`
// exists). Desktop Chrome/Edge/Firefox have `navigator.share` but
// `canShare({ files })` returns false, so we detect that and route those
// users to download / mailto / sms fallbacks instead.
const detectFileShareSupport = (): boolean => {
  const nav = navigator as any;
  if (typeof nav.share !== 'function') return false;
  if (typeof nav.canShare !== 'function') return false;
  try {
    const probe = new File(['probe'], 'probe.pdf', { type: 'application/pdf' });
    return !!nav.canShare({ files: [probe] });
  } catch {
    return false;
  }
};

interface Props {
  data: RoundExportData;
  label?: string;
}

export default function ShareMenu({ data, label = 'Share Round Summary' }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const subject = `Vegas Golf - ${data.courseName || 'Round'} ${new Date(data.date).toLocaleDateString()}`;
  const pdfFilename = `vegas-golf-${(data.courseName || 'round').replace(/\s+/g, '-').toLowerCase()}-${new Date(data.date).toISOString().split('T')[0]}.pdf`;

  const getText = () => formatRoundSummary(data);

  const showStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 3000);
  };

  // Detect whether this browser can actually share a PDF file.
  useEffect(() => {
    setCanShareFiles(detectFileShareSupport());
  }, []);

  // Pre-generate the PDF in the background so that, on mobile, the share
  // button can call navigator.share() synchronously within the user's tap
  // gesture (iOS consumes the gesture token quickly; doing work before the
  // share call causes it to silently fail and fall through to a download).
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Wait a tick for the hidden PrintableSummary to be fully laid out.
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (cancelled || !printableRef.current) return;
      setPdfGenerating(true);
      try {
        const blob = await generatePDFBlob(printableRef.current);
        if (!cancelled) setPdfBlob(blob);
      } catch (err) {
        console.error('Failed to pre-generate PDF:', err);
      } finally {
        if (!cancelled) setPdfGenerating(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // Intentionally only regenerate on mount; data changes mid-session are
    // rare enough that stale PDFs aren't worth the cost of re-rendering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Returns a PDF blob, waiting for pre-generation if necessary.
  const ensurePDFBlob = async (): Promise<Blob | null> => {
    if (pdfBlob) return pdfBlob;
    if (!printableRef.current) return null;
    setPdfGenerating(true);
    try {
      const blob = await generatePDFBlob(printableRef.current);
      setPdfBlob(blob);
      return blob;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleShare = async () => {
    // If the blob is ready, call share() immediately (preserves user gesture
    // on iOS). Otherwise generate then share (may lose gesture - user may
    // need to tap again).
    const blob = pdfBlob;
    if (blob) {
      const res = await sharePDF(blob, pdfFilename, subject);
      showStatus(res === 'shared' ? 'Shared!' : 'Downloaded PDF');
      return;
    }
    showStatus('Generating PDF…');
    const b = await ensurePDFBlob();
    if (!b) {
      showStatus('PDF generation failed');
      return;
    }
    const res = await sharePDF(b, pdfFilename, subject);
    showStatus(res === 'shared' ? 'Shared!' : 'Downloaded PDF');
  };

  const handleEmail = async () => {
    if (canShareFiles) {
      await handleShare();
    } else {
      emailSummary(getText(), subject);
    }
  };

  const handleText = async () => {
    if (canShareFiles) {
      await handleShare();
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
          disabled={pdfGenerating && !pdfBlob}
          className="bg-red-600 disabled:bg-neutral-700 text-white rounded-lg py-2 text-xs font-semibold flex flex-col items-center gap-0.5"
        >
          <span className="text-base">📤</span>
          {pdfGenerating && !pdfBlob ? 'Loading…' : 'Share PDF'}
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
        {canShareFiles
          ? 'Tap any button to open your share sheet — pick Mail, Messages, or any app.'
          : 'This browser cannot share PDFs directly. Share PDF will download the file; Email/Text use plain text.'}
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
