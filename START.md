# Wealth Command Center — Quick Start

## 1. Add your Anthropic API key
Edit `.env.local` and set your key:
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```
Get a key at https://console.anthropic.com

## 2. Run the app
```bash
npm run dev
```
Open http://localhost:3000

## 3. Add your first asset
Click **"Add Public Asset"** in the left sidebar.
- Enter a ticker (e.g. `AAPL`, `VOO`, `MSFT`)
- Enter your quantity
- The app auto-fetches the company name, price, sector, and dividend info

## 4. Add an obligation
Click **"Add Obligation"** to track a loan, bond, or mortgage.
- Enter principal, APR, and start date
- The app calculates compound daily interest accrual in real-time

## 5. Run AI Analysis
Click the refresh icon in **"The Brain"** panel (right sidebar) to get Claude-powered portfolio insights.

---

## Architecture
| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 + React 18 + Tailwind CSS |
| Data | localStorage (privacy-first, no brokerage linking) |
| Prices | Yahoo Finance (free, real-time, refreshes every 60s) |
| FX Rates | open.er-api.com (free, cached 1h) |
| AI | Claude claude-sonnet-4-6 via Anthropic API |

## Data Privacy
All your portfolio data lives **only in your browser's localStorage**.
No database, no cloud sync, no external data sharing.
The only external calls are:
- Yahoo Finance (to fetch stock prices)
- open.er-api.com (FX rates)
- Anthropic API (only when you click "Run Analysis")
