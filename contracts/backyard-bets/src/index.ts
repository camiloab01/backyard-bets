import { NearBindgen, near, call, view, LookupMap, UnorderedMap, assert } from "near-sdk-js";

@NearBindgen({})
class BackyardBetsContract {
  parties: UnorderedMap<string> = new UnorderedMap<string>("p");
  bets: UnorderedMap<string> = new UnorderedMap<string>("b");
  wagers: LookupMap<string> = new LookupMap<string>("w");
  partyBets: LookupMap<string> = new LookupMap<string>("pb");
  betWagers: LookupMap<string> = new LookupMap<string>("bw");
  oracleContract: string = "";

  // ─── Party Methods ───

  @call({})
  create_party({ name }: { name: string }): string {
    const sender = near.predecessorAccountId();
    const id = `party-${near.blockTimestamp()}`;
    const inviteCode = `${id}-${sender}`.slice(0, 16);

    const party = JSON.stringify({
      id,
      name,
      creator: sender,
      members: [sender],
      inviteCode,
      createdAt: near.blockTimestamp().toString(),
      isActive: true,
    });

    this.parties.set(id, party);
    near.log(`Party created: ${name} by ${sender}`);
    return party;
  }

  @call({})
  join_party({ invite_code }: { invite_code: string }): boolean {
    const sender = near.predecessorAccountId();

    // Find party by invite code
    const partyIds = this.parties.toArray();
    for (const [_key, value] of partyIds) {
      const party = JSON.parse(value);
      if (party.inviteCode === invite_code) {
        if (party.members.includes(sender)) {
          near.log("Already a member");
          return false;
        }
        party.members.push(sender);
        this.parties.set(party.id, JSON.stringify(party));
        near.log(`${sender} joined party: ${party.name}`);
        return true;
      }
    }

    near.log("Invalid invite code");
    return false;
  }

  // ─── Bet Methods ───

  @call({})
  create_bet({
    party_id,
    event_id,
    description,
    options,
    deadline,
  }: {
    party_id: string;
    event_id: string;
    description: string;
    options: string[];
    deadline: string;
  }): string {
    const sender = near.predecessorAccountId();
    const partyRaw = this.parties.get(party_id);
    assert(partyRaw !== null, "Party not found");

    const party = JSON.parse(partyRaw!);
    assert(party.members.includes(sender), "Not a party member");

    const id = `bet-${near.blockTimestamp()}`;
    const bet = JSON.stringify({
      id,
      partyId: party_id,
      creator: sender,
      eventId: event_id,
      description,
      options,
      deadline,
      status: "open",
      totalPool: "0",
      winningOption: null,
    });

    this.bets.set(id, bet);

    // Track which bets belong to which party
    const existingBets = this.partyBets.get(party_id);
    const betIds: string[] = existingBets ? JSON.parse(existingBets) : [];
    betIds.push(id);
    this.partyBets.set(party_id, JSON.stringify(betIds));

    near.log(`Bet created: ${description} in party ${party_id}`);
    return bet;
  }

  @call({ payableFunction: true })
  place_wager({ bet_id, option_index }: { bet_id: string; option_index: number }): string {
    const sender = near.predecessorAccountId();
    const amount = near.attachedDeposit();

    assert(amount > BigInt(0), "Must attach NEAR to place a wager");

    const betRaw = this.bets.get(bet_id);
    assert(betRaw !== null, "Bet not found");

    const bet = JSON.parse(betRaw!);
    assert(bet.status === "open", "Bet is not open");
    assert(option_index >= 0 && option_index < bet.options.length, "Invalid option index");

    // Update bet total pool
    const currentPool = BigInt(bet.totalPool);
    bet.totalPool = (currentPool + amount).toString();
    this.bets.set(bet_id, JSON.stringify(bet));

    // Store wager
    const wager = JSON.stringify({
      betId: bet_id,
      user: sender,
      optionIndex: option_index,
      amount: amount.toString(),
      timestamp: near.blockTimestamp().toString(),
    });

    const existingWagers = this.betWagers.get(bet_id);
    const wagerList: string[] = existingWagers ? JSON.parse(existingWagers) : [];
    wagerList.push(wager);
    this.betWagers.set(bet_id, JSON.stringify(wagerList));

    near.log(`${sender} wagered ${amount} on option ${option_index} for bet ${bet_id}`);
    return wager;
  }

  @call({})
  settle_bet({ bet_id, winning_option }: { bet_id: string; winning_option: number }): void {
    const betRaw = this.bets.get(bet_id);
    assert(betRaw !== null, "Bet not found");

    const bet = JSON.parse(betRaw!);
    assert(bet.status !== "settled", "Bet already settled");

    // TODO: In production, verify caller is oracle contract
    // For MVP, allow the bet creator or oracle to settle

    bet.status = "settled";
    bet.winningOption = winning_option;
    this.bets.set(bet_id, JSON.stringify(bet));

    // Calculate and distribute winnings
    const wagersRaw = this.betWagers.get(bet_id);
    if (!wagersRaw) return;

    const wagerList: string[] = JSON.parse(wagersRaw);
    const totalPool = BigInt(bet.totalPool);

    // Sum up winning side's wagers
    let winningSideTotal = BigInt(0);
    for (const w of wagerList) {
      const wager = JSON.parse(w);
      if (wager.optionIndex === winning_option) {
        winningSideTotal += BigInt(wager.amount);
      }
    }

    if (winningSideTotal === BigInt(0)) {
      near.log("No winners — pool stays in contract");
      return;
    }

    // Distribute proportionally to winners
    for (const w of wagerList) {
      const wager = JSON.parse(w);
      if (wager.optionIndex === winning_option) {
        const share = (BigInt(wager.amount) * totalPool) / winningSideTotal;
        const promise = near.promiseBatchCreate(wager.user);
        near.promiseBatchActionTransfer(promise, share);
        near.log(`Paying ${wager.user}: ${share}`);
      }
    }

    near.log(`Bet ${bet_id} settled. Winning option: ${winning_option}`);
  }

  // ─── View Methods ───

  @view({})
  get_party({ party_id }: { party_id: string }): string | null {
    return this.parties.get(party_id);
  }

  @view({})
  get_parties(): string[] {
    return this.parties.toArray().map(([_key, value]) => value);
  }

  @view({})
  get_bet({ bet_id }: { bet_id: string }): string | null {
    return this.bets.get(bet_id);
  }

  @view({})
  get_bets_for_party({ party_id }: { party_id: string }): string[] {
    const betIdsRaw = this.partyBets.get(party_id);
    if (!betIdsRaw) return [];

    const betIds: string[] = JSON.parse(betIdsRaw);
    const results: string[] = [];
    for (const id of betIds) {
      const bet = this.bets.get(id);
      if (bet) results.push(bet);
    }
    return results;
  }

  @view({})
  get_wagers_for_bet({ bet_id }: { bet_id: string }): string[] {
    const wagersRaw = this.betWagers.get(bet_id);
    if (!wagersRaw) return [];
    return JSON.parse(wagersRaw);
  }
}
