import React from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { isValidHttpUrl } from '../../utils/amazon';

interface OpenAmazonButtonProps {
  url?: string | null;
  label?: string;
  size?: 'sm' | 'md' | 'compact';
  showMissingState?: boolean;
  className?: string;
}

export const OpenAmazonButton: React.FC<OpenAmazonButtonProps> = ({
  url,
  label = 'Open Amazon',
  size = 'sm',
  showMissingState = true,
  className = '',
}) => {
  const trimmed = url?.trim();
  const hasUrl = Boolean(trimmed);
  const isValid = hasUrl && isValidHttpUrl(trimmed);

  const basePadding =
    size === 'compact'
      ? 'px-2 py-1 text-xs'
      : size === 'md'
      ? 'px-4 py-2 text-sm'
      : 'px-3 py-1.5 text-xs';

  if (!hasUrl) {
    if (!showMissingState) return null;
    return (
      <span
        title="Amazon URL missing for this product/draft"
        className={`inline-flex items-center gap-1.5 font-medium text-slate-400 bg-slate-100/90 border border-slate-200 rounded-xl cursor-not-allowed select-none transition-colors ${basePadding} ${className}`}
      >
        <ExternalLink className="w-3.5 h-3.5 opacity-40 shrink-0" />
        <span>Amazon URL missing</span>
      </span>
    );
  }

  if (!isValid) {
    return (
      <span
        title={`Invalid URL: ${trimmed}`}
        className={`inline-flex items-center gap-1.5 font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl cursor-not-allowed select-none ${basePadding} ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>{label}</span>
        <span className="text-[10px] text-amber-600 font-normal">(invalid URL)</span>
      </span>
    );
  }

  return (
    <a
      href={trimmed}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open in new tab: ${trimmed}`}
      className={`inline-flex items-center gap-1.5 font-bold text-amber-950 bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-600/40 rounded-xl shadow-xs transition-all transform active:scale-95 shrink-0 ${basePadding} ${className}`}
    >
      <ExternalLink className="w-3.5 h-3.5 shrink-0 text-amber-950" />
      <span>{label}</span>
    </a>
  );
};
