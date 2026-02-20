const API_BASE = "https://v3.football.api-sports.io";

interface FixtureStatus {
  long: string;
  short: string; // NS, LIVE, HT, FT, PST, ABD, TBD
  elapsed: number | null;
}

interface FixtureTeam {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

export interface Fixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    status: FixtureStatus;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    season: number;
    round: string;
  };
  teams: {
    home: FixtureTeam;
    away: FixtureTeam;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

interface ApiResponse {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string>;
  results: number;
  paging: { current: number; total: number };
  response: Fixture[];
}

function getApiKey(): string {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY environment variable is not set");
  return key;
}

async function apiFetch(endpoint: string, params: Record<string, string>): Promise<ApiResponse> {
  const url = new URL(endpoint, API_BASE);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": getApiKey() },
  });

  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/** Get upcoming fixtures for a league on a specific date */
export async function getFixtures(leagueId: number, season: number, date: string): Promise<Fixture[]> {
  const data = await apiFetch("/fixtures", {
    league: String(leagueId),
    season: String(season),
    date,
  });
  return data.response;
}

/** Get a single fixture by ID */
export async function getFixtureById(fixtureId: number): Promise<Fixture | null> {
  const data = await apiFetch("/fixtures", { id: String(fixtureId) });
  return data.response[0] ?? null;
}

/** Get live fixtures for a league */
export async function getLiveFixtures(leagueId: number): Promise<Fixture[]> {
  const data = await apiFetch("/fixtures", {
    league: String(leagueId),
    live: "all",
  });
  return data.response;
}

/** Get fixtures for a date range (free tier compatible) */
export async function getFixturesRange(leagueId: number, season: number, from: string, to: string): Promise<Fixture[]> {
  const data = await apiFetch("/fixtures", {
    league: String(leagueId),
    season: String(season),
    from,
    to,
  });
  return data.response;
}

/** Map API-Football status to our GameStatus */
export function mapFixtureStatus(shortStatus: string): "scheduled" | "live" | "finished" {
  switch (shortStatus) {
    case "FT":
    case "AET":
    case "PEN":
      return "finished";
    case "LIVE":
    case "1H":
    case "2H":
    case "HT":
    case "ET":
    case "BT":
    case "P":
      return "live";
    default:
      return "scheduled";
  }
}

// Common league IDs for reference
export const LEAGUES = {
  PREMIER_LEAGUE: 39,
  LA_LIGA: 140,
  SERIE_A: 135,
  BUNDESLIGA: 78,
  LIGUE_1: 61,
  CHAMPIONS_LEAGUE: 2,
  MLS: 253,
} as const;
