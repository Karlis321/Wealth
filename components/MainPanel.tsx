'use client';

import PortfolioHeader from './PortfolioHeader';
import AssetTable from './AssetTable';
import ObligationList from './ObligationList';

export default function MainPanel() {
  return (
    <main className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Portfolio summary — totals, 24h change, financial health */}
      <PortfolioHeader />

      {/* Scrollable content */}
      <div id="main-scroll" className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <div id="section-assets"><AssetTable /></div>
        <div id="section-obligations"><ObligationList /></div>
      </div>
    </main>
  );
}
