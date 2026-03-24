'use client';

import { usePortfolio } from '@/lib/PortfolioContext';
import { formatCurrency } from '@/lib/calculations';
import { Calendar } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import type { DividendEvent } from '@/lib/types';

export default function DividendCalendar({ mobile }: { mobile?: boolean } = {}) {
  const { dividendEvents, store } = usePortfolio();

  const upcoming = dividendEvents.filter((d) => d.daysUntil >= 0 && d.daysUntil <= 60);

  return (
    <aside className={`${mobile ? 'w-full h-full' : 'w-64 flex-shrink-0 border-l border-surface-border'} flex flex-col bg-surface-card overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-400/15 flex items-center justify-center">
            <Calendar size={13} className="text-amber-400" />
          </div>
          <span className="text-sm font-semibold text-slate-200">Dividend Calendar</span>
          {upcoming.length > 0 && (
            <span className="ml-auto text-xs bg-amber-400/15 text-amber-400 px-1.5 py-0.5 rounded-full">
              {upcoming.length}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-600 mt-1">Upcoming ex-dividend dates (60 days)</p>
      </div>

      {/* Dividend list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {upcoming.length === 0 && (
          <p className="text-xs text-slate-600 text-center py-8">
            No upcoming ex-div dates.<br />
            <span className="text-slate-700">Add assets with dividends to see them here.</span>
          </p>
        )}

        {upcoming.map((event) => (
          <DividendCard
            key={`${event.ticker}-${event.exDividendDate}`}
            event={event}
            baseCurrency={store.baseCurrency}
          />
        ))}
      </div>
    </aside>
  );
}

function DividendCard({
  event,
  baseCurrency,
}: {
  event: DividendEvent;
  baseCurrency: string;
}) {
  const isVeryClose = event.daysUntil <= 7;
  const parsedDate = isValid(parseISO(event.exDividendDate))
    ? parseISO(event.exDividendDate)
    : null;

  return (
    <div
      className={`rounded-lg p-2.5 border transition-colors ${
        isVeryClose
          ? 'border-amber-400/30 bg-amber-400/5'
          : 'border-surface-border bg-surface'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-mono font-bold text-slate-200">{event.ticker}</span>
          <p className="text-[10px] text-slate-600 truncate max-w-[100px]">{event.name}</p>
        </div>
        <div className="text-right">
          {event.totalPayment != null && (
            <p className="text-xs font-mono text-amber-400" title="Annual dividend total">
              +{formatCurrency(event.totalPayment, baseCurrency)}/yr
            </p>
          )}
          <span
            className={`text-[10px] font-medium ${
              isVeryClose ? 'text-amber-400' : 'text-slate-500'
            }`}
          >
            {event.daysUntil === 0 ? 'TODAY' : `${event.daysUntil}d away`}
          </span>
        </div>
      </div>
      {parsedDate && (
        <p className="text-[10px] text-slate-700 mt-1">
          Ex-Div: {format(parsedDate, 'MMM d, yyyy')}
        </p>
      )}
    </div>
  );
}
