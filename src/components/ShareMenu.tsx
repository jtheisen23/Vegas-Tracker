import { useState } from 'react';
import { RoundExportData, formatRoundSummary, shareSummary, emailSummary, textSummary, copySummary } from '../utils/export';

interface Props {
  data: RoundExportData;
  label?: string;
}

export default function ShareMenu({ data, label = 'Share Round Summary' }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const subject = `Vegas Golf - ${data.courseName || 'Round'} ${new Date(data.date).toLocaleDateString()}`;

  const getText = () => formatRoundSummary(data);

  const showStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 2500);
  };

  const handleShare = async () => {
    const res = await shareSummary(getText(), subject);
    if (res === 'shared') {
      /* native share completed */
    } else if (res === 'copied') {
      showStatus('Copied to clipboard');
    } else {
      showStatus('Share not supported - use Copy');
    }
  };

  const handleEmail = () => {
    emailSummary(getText(), subject);
  };

  const handleText = () => {
    textSummary(getText());
  };

  const handleCopy = async () => {
    const ok = await copySummary(getText());
    showStatus(ok ? 'Copied to clipboard' : 'Copy failed');
  };

  return (
    <div className="bg-neutral-900 rounded-xl p-3">
      <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={handleShare}
          className="bg-red-600 text-white rounded-lg py-2 text-xs font-semibold flex flex-col items-center gap-0.5"
        >
          <span className="text-base">📤</span>
          Share
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
      {status && (
        <div className="mt-2 text-xs text-yellow-400 text-center">{status}</div>
      )}
    </div>
  );
}
