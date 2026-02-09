# Backyard Bets Hackathon Plan
## Social Betting App on NEAR

**Timeline:** Feb 9 - Feb 16 (7 days)  
**Stack:** Next.js + TypeScript + NEAR Protocol  

---

## Project Overview

### Core Concept
Private betting pools ("parties") where friends can bet on sports events. Think Polymarket meets private Discord channels.

### MVP Features (Must Have)
1. Create/join betting parties (invite-only via link)
2. Create bets on sports events within a party
3. Place bets with NEAR tokens
4. Oracle fetches game results from sports API
5. Automatic settlement and payout

### Nice-to-Have (If Time Permits)
- Leaderboards within parties
- Chat/comments on bets
- Multiple bet types (spread, over/under)
- Party history/stats
- Mobile-responsive polish

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                    Next.js + TypeScript                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Wallet  │  │  Party   │  │   Bet    │  │   Results    │   │
│  │ Connect  │  │  Lobby   │  │  Board   │  │   Display    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEAR BLOCKCHAIN                            │
│  ┌────────────────────────┐    ┌────────────────────────────┐  │
│  │   Backyard Bets Contract    │    │     Oracle Contract        │  │
│  │  - create_party()      │◄───│  - submit_result()         │  │
│  │  - join_party()        │    │  - get_latest_result()     │  │
│  │  - create_bet()        │    │  - authorized_submitters   │  │
│  │  - place_wager()       │    └────────────────────────────┘  │
│  │  - settle_bet()        │                 ▲                  │
│  └────────────────────────┘                 │                  │
└─────────────────────────────────────────────────────────────────┘
                                              │
┌─────────────────────────────────────────────────────────────────┐
│                      ORACLE SERVICE                             │
│              (Next.js API Route / Cron Job)                     │
│  ┌──────────────────┐    ┌──────────────────────────────────┐  │
│  │  Sports API      │───►│  Fetch results → Submit to NEAR  │  │
│  │  (API-Football)  │    │  Runs every 5 min for live games │  │
│  └──────────────────┘    └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Frontend | Next.js 14 (App Router) | Your expertise + fast development |
| Styling | Tailwind CSS | Rapid prototyping |
| NEAR SDK | near-api-js | Official SDK |
| Wallet | NEAR Wallet Selector | Supports multiple wallets |
| Smart Contracts | TypeScript (near-sdk-js) | Same language as frontend, faster dev |
| Sports API | API-Football (free tier) | 100 req/day free, good coverage |
| Deployment | Vercel + NEAR Testnet | Free, fast |
| State Management | Zustand or React Context | Lightweight |

### Why TypeScript Contracts?
- **No context switching** — Same language for frontend and contracts
- **Faster iteration** — No Rust learning curve
- **Shared types** — Can share interfaces between contract and frontend
- **Familiar tooling** — npm, jest, your usual workflow

---

## Smart Contract Design

### Backyard Bets Contract (TypeScript)

```typescript
import { NearBindgen, near, call, view, LookupMap, UnorderedMap } from "near-sdk-js";

// Core data structures
interface Party {
  id: string;
  name: string;
  creator: string;
  members: string[];
  inviteCode: string;
  createdAt: bigint;
  isActive: boolean;
}

interface Bet {
  id: string;
  partyId: string;
  creator: string;
  eventId: string;           // External sports event ID
  description: string;       // "Lakers vs Celtics - Winner"
  options: string[];         // ["Lakers", "Celtics"]
  deadline: bigint;          // Betting closes at game start
  status: "open" | "closed" | "settled";
  totalPool: bigint;
  winningOption?: number;
}

interface Wager {
  odlbetId: string;
  user: string;
  optionIndex: number;       // Which option they bet on
  amount: bigint;
  timestamp: bigint;
}

@NearBindgen({})
class Backyard BetsContract {
  parties: UnorderedMap<Party> = new UnorderedMap("p");
  bets: UnorderedMap<Bet> = new UnorderedMap("b");
  wagers: LookupMap<Wager[]> = new LookupMap("w");
  oracleContract: string = "";

  // Key methods
  @call({})
  create_party({ name }: { name: string }): Party { /* ... */ }

  @call({})
  join_party({ invite_code }: { invite_code: string }): boolean { /* ... */ }

  @call({})
  create_bet({ party_id, event_id, description, options, deadline }): Bet { /* ... */ }

  @call({ payableFunction: true })
  place_wager({ bet_id, option_index }: { bet_id: string; option_index: number }): Wager { /* ... */ }

  @call({})
  settle_bet({ bet_id, winning_option }: { bet_id: string; winning_option: number }): void { /* ... */ }

  @call({})
  claim_winnings({ bet_id }: { bet_id: string }): bigint { /* ... */ }

  @view({})
  get_party({ party_id }: { party_id: string }): Party | null { /* ... */ }

  @view({})
  get_bets({ party_id }: { party_id: string }): Bet[] { /* ... */ }
}
```

### Oracle Contract (TypeScript)

```typescript
import { NearBindgen, near, call, view, LookupMap } from "near-sdk-js";

interface GameResult {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "live" | "finished";
  timestamp: bigint;
}

@NearBindgen({})
class OracleContract {
  results: LookupMap<GameResult> = new LookupMap("r");
  authorizedSubmitters: string[] = [];
  owner: string = "";

  @call({})
  submit_result({ event_id, result }: { event_id: string; result: GameResult }): void {
    // Only authorized accounts can submit
  }

  @view({})
  get_result({ event_id }: { event_id: string }): GameResult | null { /* ... */ }

  @call({})
  add_authorized_submitter({ account_id }: { account_id: string }): void {
    // Owner only
  }
}
```

---

## Daily Schedule

### Day 1: Sunday, Feb 9 — Foundation
**Goal:** Architecture finalized, environment setup, contract scaffolding

| Time | Task | Deliverable |
|------|------|-------------|
| Morning | Finalize architecture decisions | This document ✓ |
| Morning | Set up NEAR development environment | near-cli + testnet account |
| Afternoon | Scaffold Next.js project | Repo with folder structure |
| Afternoon | Create contract project with near-sdk-js | TypeScript contract compiles |
| Evening | Design basic UI wireframes | Figma/sketches of 4 main screens |

**End of day checkpoint:**
- [ ] NEAR testnet wallet created
- [ ] Next.js app running locally
- [ ] Empty TypeScript contract compiles to WASM
- [ ] Basic wireframes for: Home, Party, Bet, Results

---

### Day 2: Monday, Feb 10 — Smart Contracts Core
**Goal:** Core betting logic working on testnet

| Time | Task | Deliverable |
|------|------|-------------|
| Morning | Implement Party class + create/join methods | Party creation works |
| Afternoon | Implement Bet class + create_bet method | Can create bets |
| Afternoon | Implement place_wager (payable) | NEAR deposits work |
| Evening | Implement settle_bet + payouts | Manual settlement works |
| Evening | Deploy to testnet + test via CLI | Contract deployed |

**End of day checkpoint:**
- [ ] Can create party via near-cli
- [ ] Can create bet in party
- [ ] Can place wager (deposits NEAR)
- [ ] Can settle bet (distributes winnings)

---

### Day 3: Tuesday, Feb 11 — Oracle + Sports API
**Goal:** Oracle fetching real sports data

| Time | Task | Deliverable |
|------|------|-------------|
| Morning | Sign up for API-Football, test endpoints | API key working |
| Morning | Create Oracle contract | Deployed to testnet |
| Afternoon | Build oracle service (Next.js API route) | /api/oracle/update |
| Afternoon | Connect oracle to Backyard Bets contract | settle_bet uses oracle |
| Evening | Test end-to-end with past game | Full flow works |

**End of day checkpoint:**
- [ ] Oracle contract deployed
- [ ] API route fetches game results
- [ ] Results posted to NEAR
- [ ] Backyard Bets reads from Oracle

---

### Day 4: Wednesday, Feb 12 — Frontend Core
**Goal:** Basic UI functional with wallet connection

| Time | Task | Deliverable |
|------|------|-------------|
| Morning | NEAR wallet integration | Connect/disconnect works |
| Morning | Home page + create party flow | Can create party in UI |
| Afternoon | Party page + member list | Shows party details |
| Afternoon | Create bet modal | Can create bets in UI |
| Evening | Bet board + place wager | Can place bets in UI |

**End of day checkpoint:**
- [ ] Wallet connects
- [ ] Can create party in UI
- [ ] Can create and place bets
- [ ] Basic but functional UI

---

### Day 5: Thursday, Feb 13 — Integration + Polish
**Goal:** Full user flow working end-to-end

| Time | Task | Deliverable |
|------|------|-------------|
| Morning | Invite link system | Join party via link |
| Morning | Event selection from API | Browse upcoming games |
| Afternoon | Results display + claim winnings | See outcomes, claim |
| Afternoon | Error handling + loading states | UX polish |
| Evening | Fix integration bugs | Stable demo path |

**End of day checkpoint:**
- [ ] Can invite friends via link
- [ ] Can select real sports events
- [ ] Can see results and claim
- [ ] No breaking bugs in happy path

---

### Day 6: Friday, Feb 14 — Polish + Demo Prep
**Goal:** Demo-ready product

| Time | Task | Deliverable |
|------|------|-------------|
| Morning | UI polish (spacing, colors, fonts) | Looks presentable |
| Morning | Mobile responsiveness (basic) | Doesn't break on mobile |
| Afternoon | Create demo script | Step-by-step demo flow |
| Afternoon | Record backup video | 2-3 min demo video |
| Evening | Deploy to production URL | Live on Vercel |

**End of day checkpoint:**
- [ ] Deployed to vercel
- [ ] Demo script written
- [ ] Backup video recorded
- [ ] README complete

---

### Day 7: Saturday, Feb 15 — Buffer + Submission
**Goal:** Submit with confidence

| Time | Task | Deliverable |
|------|------|-------------|
| Morning | Final testing | All flows work |
| Morning | Fix any last bugs | Stable |
| Afternoon | Prepare pitch/presentation | Slides if needed |
| Afternoon | Submit to hackathon | ✅ DONE |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| near-sdk-js quirks | Check examples, NEAR Discord for help |
| Sports API rate limits | Cache aggressively, mock data for demo |
| Contract bugs | Write tests, test on testnet early |
| Time crunch | Cut nice-to-haves, focus on demo path |
| Oracle complexity | Simplify: manual trigger acceptable for hackathon |

### Fallback Simplifications
If behind schedule, simplify:

1. **Oracle**: Manual admin trigger instead of automated
2. **Bet types**: Binary outcomes only (Team A vs Team B)
3. **Invite system**: Share party ID instead of fancy links
4. **Settlement**: Manual trigger instead of watching game end
5. **UI**: Functional > pretty

---

## File Structure

```
backyard-bets/
├── apps/
│   └── web/                      # Next.js frontend
│       ├── app/
│       │   ├── page.tsx          # Home/landing
│       │   ├── party/
│       │   │   ├── create/page.tsx
│       │   │   └── [id]/page.tsx # Party detail
│       │   └── api/
│       │       └── oracle/
│       │           └── update/route.ts
│       ├── components/
│       │   ├── WalletConnect.tsx
│       │   ├── PartyCard.tsx
│       │   ├── BetCard.tsx
│       │   ├── CreateBetModal.tsx
│       │   └── PlaceWagerModal.tsx
│       ├── lib/
│       │   ├── near.ts           # NEAR connection
│       │   ├── contracts.ts      # Contract calls
│       │   └── sports-api.ts     # API-Football client
│       └── hooks/
│           ├── useNear.ts
│           ├── useParty.ts
│           └── useBets.ts
│
├── contracts/
│   ├── backyard-bets/                # Main contract (TypeScript)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── build.sh
│   │   └── src/
│   │       ├── index.ts          # Main contract entry
│   │       ├── models/
│   │       │   ├── party.ts
│   │       │   ├── bet.ts
│   │       │   └── wager.ts
│   │       └── utils.ts
│   └── oracle/                   # Oracle contract (TypeScript)
│       ├── package.json
│       ├── tsconfig.json
│       ├── build.sh
│       └── src/
│           └── index.ts
│
├── shared/                       # Shared types between frontend & contracts
│   └── types.ts
│
├── scripts/
│   ├── deploy.sh
│   └── test-flow.sh
│
└── README.md
```

---

## Key Resources

### NEAR Development
- [NEAR Docs](https://docs.near.org/)
- [near-sdk-js GitHub](https://github.com/near/near-sdk-js)
- [near-sdk-js Examples](https://github.com/near/near-sdk-js/tree/develop/examples)
- [NEAR Wallet Selector](https://github.com/near/wallet-selector)
- [Create NEAR App](https://github.com/near/create-near-app)
- [NEAR JS Contract Quickstart](https://docs.near.org/sdk/js/introduction)

### Sports API
- [API-Football Docs](https://www.api-football.com/documentation-v3)
- Free tier: 100 requests/day (enough for demo)
- Endpoints needed:
  - `GET /fixtures` (upcoming games)
  - `GET /fixtures?id={id}` (game details/results)

### Example Code References
- [NEAR Counter Example (JS)](https://github.com/near-examples/js-counter) - Basic contract
- [NEAR Guest Book (JS)](https://github.com/near-examples/guest-book-js) - Payable functions
- [NEAR FT Example (JS)](https://github.com/near-examples/ft-tutorial-js) - Token transfers

---

## Demo Script (Draft)

1. **Intro** (30s): "Backyard Bets - private betting pools with friends"
2. **Connect wallet** (15s): Show NEAR wallet connection
3. **Create party** (30s): Create "Super Bowl Party" 
4. **Share invite** (15s): Copy link, show joining
5. **Browse events** (30s): Select upcoming NBA game
6. **Create bet** (30s): "Lakers vs Celtics - Winner"
7. **Place wagers** (30s): Two users bet opposite sides
8. **Show settlement** (30s): Game ends, oracle posts result
9. **Claim winnings** (15s): Winner claims payout
10. **Wrap up** (15s): Future vision, thank sponsors

**Total: ~4 minutes**

---

## Immediate Next Steps (Today)

1. [ ] Set up NEAR development environment
   ```bash
   # Install NEAR CLI
   npm install -g near-cli
   
   # Create testnet account
   near create-account your-name.testnet --useFaucet
   
   # Verify it works
   near state your-name.testnet
   ```

2. [ ] Initialize project with TypeScript contracts
   ```bash
   # Create project with NEAR's template
   npx create-near-app@latest backyard-bets --frontend nextjs --contract ts
   cd backyard-bets
   
   # Or manual setup:
   npx create-next-app@latest backyard-bets --typescript --tailwind --app
   cd backyard-bets
   mkdir -p contracts/backyard-bets/src contracts/oracle/src
   ```

3. [ ] Set up contract package
   ```bash
   cd contracts/backyard-bets
   npm init -y
   npm install near-sdk-js
   npm install -D typescript near-cli
   ```

4. [ ] Sign up for API-Football
   - Go to https://www.api-football.com/
   - Get free API key
   - Test with curl

5. [ ] Sketch wireframes (paper/Figma)
   - Home screen
   - Party detail
   - Bet board
   - Settlement view

---

## Success Criteria

### Minimum for Submission
- [ ] Create a betting party
- [ ] Invite friends (via link/code)
- [ ] Create a bet on a sports event
- [ ] Place wagers with NEAR
- [ ] Settle bet based on real result
- [ ] Distribute winnings

### Bonus Points
- [ ] Clean, polished UI
- [ ] Real-time updates
- [ ] Multiple concurrent parties
- [ ] Leaderboard
- [ ] Mobile-friendly

---

*Last updated: Feb 9, 2025*
*Good luck! 🚀*
