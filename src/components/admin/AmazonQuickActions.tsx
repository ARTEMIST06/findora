import React from 'react';
import { ExternalLink, Check, AlertTriangle } from 'lucide-react';
import { isValidHttpUrl } from '../../utils/amazon';

export interface AmazonQuickActionsProps {
  productUrl?: string | null;
  affiliateUrl?: string | null;
  needsVerification?: boolean;
  size?: 'compact' | 'sm' | 'md';
  className?: string;
}

export const AmazonQuickActions: React.FC<AmazonQuickActionsProps> = ({
  productUrl,
  affiliateUrl,
  needsVerification = false,
  size = 'compact',
  className = '',
}) => {
  const trimmedProductUrl = productUrl?.trim() || '';
  const hasProductUrl = Boolean(trimmedProductUrl && isValidHttpUrl(trimmedProductUrl));

  const trimmedAffiliateUrl = affiliateUrl?.trim() || '';
  const hasAffiliateUrl = Boolean(trimmedAffiliateUrl && isValidHttpUrl(trimmedAffiliateUrl));

  const buttonPadding =
    size === 'compact'
      ? 'px-2.5 py-1 text-xs'
      : size === 'md'
      ? 'px-3.5 py-1.5 text-sm'
      : 'px-3 py-1 text-xs';

  return (
    <div className={`flex flex-col gap-1.5 items-start max-w-[240px] ${className}`}>
      {/* Verification Warning (e.g. for duplicates) */}
      {needsVerification && (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded-lg px-2 py-0.5 whitespace-nowrap shadow-2xs"
          title="Amazon product URL and affiliate URL require verification before publishing"
        >
          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
          <span>⚠ Amazon link needs verification</span>
        </span>
      )}

      {/* 1. Amazon Product Action: opens stored Amazon product URL */}
      {hasProductUrl ? (
        <a
          href={trimmedProductUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Open stored Amazon product page in new tab: ${trimmedProductUrl}`}
          className={`inline-flex items-center gap-1.5 font-bold text-amber-950 bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-600/30 rounded-xl shadow-xs transition-all active:scale-95 shrink-0 whitespace-nowrap ${buttonPadding}`}
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0 text-amber-950" />
          <span>Open Amazon</span>
        </a>
      ) : (
        <span
          title="Amazon product URL is missing for this item"
          className={`inline-flex items-center gap-1.5 font-medium text-slate-400 bg-slate-100/90 border border-slate-200 rounded-xl cursor-not-allowed select-none shrink-0 whitespace-nowrap ${buttonPadding}`}
        >
          <ExternalLink className="w-3.5 h-3.5 opacity-40 shrink-0" />
          <span>Amazon URL missing</span>
        </span>
      )}

      {/* 2. Amazon Affiliate Status & Action */}
      {hasAffiliateUrl ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2 py-0.5 whitespace-nowrap"
            title="Amazon affiliate link is configured for this item"
          >
            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Affiliate link added</span>
          </span>
          <a
            href={trimmedAffiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open stored affiliate URL in new tab: ${trimmedAffiliateUrl}`}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg px-2 py-0.5 transition-colors whitespace-nowrap shrink-0"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span>Open Affiliate Link</span>
          </a>
        </div>
      ) : (
        <div className="flex items-center">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/80 rounded-lg px-2 py-0.5 whitespace-nowrap"
            title="Amazon affiliate link is missing for this item"
          >
            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Affiliate link missing</span>
          </span>
        </div>
      )}
    </div>
  );
};
