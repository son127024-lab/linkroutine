# LinkRoutine / 링크 루틴

LinkRoutine is a privacy-first URL mailbox, icon dashboard, Smart Viewer, and monthly subscription prototype designed for Pi Browser.

## Core Concept

Users paste a frequently used URL into the URL Mailbox, choose a category, and instantly get a home-screen-style icon. Tapping a saved icon opens Smart Viewer with X close, fullscreen request, Wide Assist Mode, and Open Original fallback.

## V1.1 Monetization Model

Final K4-approved model:

- Monthly subscription starts at **1 Pi**.
- Direct monthly Pi payouts are **not included** in the initial version.
- Users earn **Link Points** through qualified visits.
- Qualified visits can reduce the next monthly subscription fee.
- Discount rule: every 1,000 qualified visits = 0.1 Pi discount.
- Maximum discount: 0.5 Pi.
- Minimum monthly fee: 0.5 Pi.
- Future cashback is reserved for a later version only after real ad revenue is proven.

## MVP Features

- Pi SDK username + payments scope connection
- Monthly subscription payment flow with mock fallback
- URL Mailbox input
- Category dropdown on the right side of the URL input
- Automatic icon generation
- Icon-style first page
- Settings panel for selected URL deletion
- Smart Viewer with X close button
- Fullscreen request button
- Wide Assist Mode for portrait-locked Pi Browser environments
- Qualified Visit timer inside Smart Viewer
- Link Points and next-fee discount calculation
- App Router API routes for Pi payment callbacks
- Fallback Pages API copies stored in `fallback-pages-api/` for Vercel troubleshooting

## Install

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the app in Pi Browser for real Pi SDK authentication and payments.

## Local Simulation

```bash
npm run simulate
```

This checks URL normalization, icon creation, saved icon tap, selected deletion, YouTube detection, Qualified Visit counting, Link Points, subscription discount cap, no direct cashback, and mock Pi payment callback logic.

## Environment Variables

```bash
NEXT_PUBLIC_PI_SANDBOX=true
NEXT_PUBLIC_ENABLE_MOCK_PI=true

NEXT_PUBLIC_MONTHLY_SUBSCRIPTION_PI=1
NEXT_PUBLIC_VISITS_PER_DISCOUNT_STEP=1000
NEXT_PUBLIC_DISCOUNT_PER_STEP_PI=0.1
NEXT_PUBLIC_MAX_DISCOUNT_PI=0.5
NEXT_PUBLIC_MIN_SUBSCRIPTION_FEE_PI=0.5
NEXT_PUBLIC_QUALIFIED_VISIT_SECONDS=30
NEXT_PUBLIC_VISIT_COOLDOWN_MINUTES=10

NEXT_PUBLIC_TEST_PAYMENT_AMOUNT=0.01
PI_API_KEY=replace_with_your_pi_developer_api_key
```

Set `NEXT_PUBLIC_ENABLE_MOCK_PI=false` when testing inside Pi Browser with a real SDK connection.

## Important Compliance Notes

- Do not market LinkRoutine as a mining booster.
- Do not claim that external website usage guarantees Pi rewards.
- Do not promise direct Pi payouts in V1.
- Use “Link Points discount” wording instead of “Pi cashback” until real ad revenue is proven.
- Do not use official Pi logos or branding in a misleading way.
- External websites may block embedded viewing; Smart Viewer includes Open Original fallback.
- Fullscreen and Wide Assist depend on Pi Browser and target website support.

## Vercel API Fallback Note

The active project uses App Router API routes under `app/api/payments/*`. If Vercel Production ever returns 404 for these routes, copy the files from `fallback-pages-api/payments/` into `pages/api/payments/` and redeploy. Do not keep both active at the same route path at the same time.

## Version Plan

### V1.1
Pi SDK login, monthly subscription payment, URL mailbox, category icons, Smart Viewer, settings deletion, Link Points, Qualified Visit discount calculation.

### V2.0
Qualified Visit anti-abuse hardening, premium themes, backup export, custom icons, advanced Link Points dashboard.

### V3.0
Ad revenue test, real ad performance dashboard, country/traffic quality analysis.

### V4.0
Limited Pi cashback only if real ad revenue proves it is sustainable.


## Pi SDK Popup Troubleshooting

If the Pi Network Authentication window or Wallet payment window does not appear:

1. Confirm this script exists in `app/layout.tsx`:
   `https://sdk.minepi.com/pi-sdk.js`
2. Confirm Vercel Environment Variables:
   - `NEXT_PUBLIC_ENABLE_MOCK_PI=false`
   - `NEXT_PUBLIC_PI_SANDBOX=true`
   - `PI_API_KEY=<LinkRoutine Developer Portal API Key>`
3. Open the app through Pi Browser Sandbox / Development URL, not a normal desktop browser.
4. Confirm Pi Developer Portal Development URL points to the current Vercel Production URL.
5. In the browser console, check `window.__LINKROUTINE_PI_DEBUG__`.
6. Payment requires both API routes to be live:
   - `/api/payments/approve`
   - `/api/payments/complete`

If the Wallet still does not open, redeploy Vercel after changing environment variables.


## V1.5 External Site Notice

This build adds a visible notice to the main dashboard and blocked-site viewer:

> Some external websites may not open inside LinkRoutine due to current Pi Browser and website security limits. External site connection features may be expanded after the full Open Mainnet environment becomes available.

Korean UI copy:

> 일부 외부 사이트는 현재 Pi Browser 및 각 웹사이트의 보안 정책으로 인해 LinkRoutine 안에서 바로 열리지 않을 수 있습니다. 외부 사이트 연결 기능은 완전 오픈 메인넷 이후 확장될 수 있습니다.

This message helps position LinkRoutine safely as a user-controlled link routine app, not a guaranteed external-site embedding tool.
