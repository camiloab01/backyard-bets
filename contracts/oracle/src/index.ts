import { NearBindgen, near, call, view, LookupMap, assert } from "near-sdk-js";

@NearBindgen({})
class OracleContract {
  results: LookupMap<string> = new LookupMap<string>("r");
  authorizedSubmitters: string[] = [];
  owner: string = "";

  @call({})
  init(): void {
    assert(this.owner === "", "Already initialized");
    this.owner = near.predecessorAccountId();
    this.authorizedSubmitters = [this.owner];
    near.log(`Oracle initialized. Owner: ${this.owner}`);
  }

  @call({})
  add_authorized_submitter({ account_id }: { account_id: string }): void {
    assert(near.predecessorAccountId() === this.owner, "Only owner can add submitters");
    if (!this.authorizedSubmitters.includes(account_id)) {
      this.authorizedSubmitters.push(account_id);
      near.log(`Added authorized submitter: ${account_id}`);
    }
  }

  @call({})
  submit_result({
    event_id,
    home_team,
    away_team,
    home_score,
    away_score,
    status,
  }: {
    event_id: string;
    home_team: string;
    away_team: string;
    home_score: number;
    away_score: number;
    status: string;
  }): void {
    const sender = near.predecessorAccountId();
    assert(this.authorizedSubmitters.includes(sender), "Not authorized to submit results");

    const result = JSON.stringify({
      eventId: event_id,
      homeTeam: home_team,
      awayTeam: away_team,
      homeScore: home_score,
      awayScore: away_score,
      status,
      timestamp: near.blockTimestamp().toString(),
    });

    this.results.set(event_id, result);
    near.log(`Result submitted for event ${event_id}: ${home_team} ${home_score} - ${away_score} ${away_team}`);
  }

  @view({})
  get_result({ event_id }: { event_id: string }): string | null {
    return this.results.get(event_id);
  }

  @view({})
  get_owner(): string {
    return this.owner;
  }

  @view({})
  get_authorized_submitters(): string[] {
    return this.authorizedSubmitters;
  }
}
