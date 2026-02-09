# Backyard Bets Daily Checklist
## Quick Reference for Hackathon

---

## Day 1: Sunday, Feb 9 — Foundation
### Morning
- [ ] Read this plan thoroughly
- [ ] Install NEAR CLI: `npm install -g near-cli`
- [ ] Create testnet account: `near create-account yourname.testnet --useFaucet`
- [ ] Verify: `near state yourname.testnet`

### Afternoon
- [ ] Create project: `npx create-near-app@latest backyard-bets --frontend nextjs --contract ts`
- [ ] Or manual: `npx create-next-app@latest backyard-bets --typescript --tailwind --app`
- [ ] Set up contract folder structure (see plan)
- [ ] Install near-sdk-js in contracts folder: `npm install near-sdk-js`

### Evening
- [ ] Sketch 4 wireframes (paper is fine):
  - Home/Landing
  - Party Detail
  - Bet Board
  - Results/Settlement
- [ ] Sign up for API-Football, test API key

**✅ Day 1 Done When:**
- NEAR CLI works (`near --version`)
- Next.js runs locally (`npm run dev`)
- Empty contract compiles (`npm run build` in contracts folder)
- Have wireframe sketches

---

## Day 2: Monday, Feb 10 — Smart Contracts
### Morning
- [ ] Define Party interface and class
- [ ] Implement `create_party()` method
- [ ] Implement `join_party()` method
- [ ] Test via near-cli

### Afternoon
- [ ] Define Bet interface and class
- [ ] Implement `create_bet()` method
- [ ] Implement `place_wager()` (payable - accepts NEAR)
- [ ] Test deposits work

### Evening
- [ ] Implement `settle_bet()` method
- [ ] Implement payout distribution logic
- [ ] Deploy to testnet
- [ ] Test full flow via CLI

**✅ Day 2 Done When:**
```bash
# These all work:
near call contract.testnet create_party '{"name":"Test"}' --accountId you.testnet
near call contract.testnet create_bet '{"party_id":"...","description":"Test bet","options":["A","B"]}' --accountId you.testnet
near call contract.testnet place_wager '{"bet_id":"...","option":0}' --accountId you.testnet --deposit 1
near call contract.testnet settle_bet '{"bet_id":"...","winning_option":0}' --accountId you.testnet
```

---

## Day 3: Tuesday, Feb 11 — Oracle
### Morning
- [ ] Test API-Football endpoints:
  - `/fixtures` (upcoming games)
  - `/fixtures?id={id}` (results)
- [ ] Create Oracle contract class
- [ ] Implement `submit_result()` (authorized only)
- [ ] Implement `get_result()`
- [ ] Deploy Oracle to testnet

### Afternoon
- [ ] Create `/api/oracle/update` route in Next.js
- [ ] Fetch game result from API-Football
- [ ] Submit to Oracle contract
- [ ] Modify Backyard Bets to read from Oracle

### Evening
- [ ] Test with a completed game
- [ ] Full flow: create bet → game ends → oracle updates → settle

**✅ Day 3 Done When:**
- Oracle contract deployed
- API route successfully posts results to NEAR
- `settle_bet` reads from Oracle contract

---

## Day 4: Wednesday, Feb 12 — Frontend Core
### Morning
- [ ] Install wallet-selector: `npm install @near-wallet-selector/core @near-wallet-selector/my-near-wallet`
- [ ] Create `WalletConnect` component
- [ ] Test connect/disconnect
- [ ] Create Home page with "Create Party" button

### Afternoon  
- [ ] Create Party page (`/party/[id]`)
- [ ] Show party name, members
- [ ] Add "Create Bet" button
- [ ] Create `CreateBetModal` component

### Evening
- [ ] Create `BetCard` component
- [ ] Create `PlaceWagerModal` component
- [ ] Wire up to contract calls
- [ ] Test creating party + bet in UI

**✅ Day 4 Done When:**
- Can connect NEAR wallet in browser
- Can create party through UI
- Can create bet through UI
- Can place wager through UI

---

## Day 5: Thursday, Feb 13 — Integration
### Morning
- [ ] Implement invite link system (`/party/join?code=xxx`)
- [ ] Add game selection (fetch from API-Football)
- [ ] Show real upcoming games in bet creation

### Afternoon
- [ ] Build results view
- [ ] Implement "Claim Winnings" button
- [ ] Add loading states everywhere
- [ ] Add error toasts/messages

### Evening
- [ ] Test complete user flow end-to-end
- [ ] Fix any integration bugs
- [ ] Test with 2 different wallets

**✅ Day 5 Done When:**
- Can share invite link, friend joins
- Can select real sports event
- Can see results and claim winnings
- No crashes in happy path

---

## Day 6: Friday, Feb 14 — Polish
### Morning
- [ ] UI cleanup:
  - Consistent spacing
  - Color scheme (keep simple)
  - Typography hierarchy
- [ ] Add app logo/branding (simple)
- [ ] Basic mobile responsiveness

### Afternoon
- [ ] Write demo script (see plan)
- [ ] Practice demo 2-3 times
- [ ] Record backup video (screen record)
- [ ] Deploy to Vercel

### Evening
- [ ] Write README:
  - What it does
  - How to run
  - Tech stack
  - Team info
- [ ] Final testing on deployed version

**✅ Day 6 Done When:**
- Live on Vercel
- Demo script memorized
- Backup video recorded
- README complete

---

## Day 7: Saturday, Feb 15 — Submit
### Morning
- [ ] Final smoke test
- [ ] Fix any critical bugs
- [ ] Update README if needed

### Afternoon
- [ ] Prepare submission:
  - Project description
  - Demo video link
  - GitHub repo link
  - Deployed URL
- [ ] SUBMIT! 🎉

### After Submission
- [ ] Breathe
- [ ] Prep for any live demo/Q&A

---

## Emergency Contacts / Resources

**NEAR Discord:** https://discord.gg/near  
**API-Football Support:** https://www.api-football.com/contact  
**Vercel Status:** https://status.vercel.com  

---

## Quick Commands Reference

```bash
# Build contract (from contracts/backyard-bets directory)
npm run build
# This typically runs: near-sdk-js build src/index.ts build/backyard-bets.wasm

# Deploy contract
near deploy contract.testnet ./build/backyard-bets.wasm

# Call contract
near call contract.testnet method_name '{"arg":"value"}' --accountId you.testnet

# View contract state
near view contract.testnet get_party '{"party_id":"xxx"}'

# Run Next.js
npm run dev

# Deploy to Vercel
vercel --prod
```

---

## If You're Behind Schedule

### Cut List (in order):
1. ❌ Leaderboards
2. ❌ Chat/comments
3. ❌ Multiple bet types → binary only
4. ❌ Automated oracle → manual trigger
5. ❌ Fancy invite links → share party ID
6. ❌ Mobile polish → desktop only
7. ❌ Real-time updates → manual refresh

### Non-Negotiable (must work for demo):
1. ✅ Create party
2. ✅ Create bet
3. ✅ Place wager (NEAR deposit)
4. ✅ Settle bet
5. ✅ Claim winnings

---

*Print this out. Check boxes as you go. You got this! 💪*
