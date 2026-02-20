import { NextRequest, NextResponse } from "next/server";
import { getFixtures, getFixturesRange, LEAGUES } from "@/lib/sports-api";

/**
 * GET /api/fixtures?league=39&date=2025-02-01&season=2024
 * GET /api/fixtures?league=39&from=2025-02-01&to=2025-02-07&season=2024
 *
 * Proxy to API-Football for browsing games.
 * Free tier: seasons 2022-2024, date range within allowed window.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const leagueId = Number(params.get("league") || LEAGUES.PREMIER_LEAGUE);
    const season = Number(params.get("season") || 2024);
    const date = params.get("date");
    const from = params.get("from");
    const to = params.get("to");

    let fixtures;
    if (from && to) {
      fixtures = await getFixturesRange(leagueId, season, from, to);
    } else if (date) {
      fixtures = await getFixtures(leagueId, season, date);
    } else {
      // Default: get a recent week of Premier League
      fixtures = await getFixturesRange(leagueId, season, "2025-02-01", "2025-02-08");
    }

    // Slim down the response to what the frontend needs
    const simplified = fixtures.map((f) => ({
      id: f.fixture.id,
      date: f.fixture.date,
      timestamp: f.fixture.timestamp,
      status: f.fixture.status.short,
      league: f.league.name,
      round: f.league.round,
      homeTeam: { id: f.teams.home.id, name: f.teams.home.name, logo: f.teams.home.logo },
      awayTeam: { id: f.teams.away.id, name: f.teams.away.name, logo: f.teams.away.logo },
      homeScore: f.goals.home,
      awayScore: f.goals.away,
    }));

    return NextResponse.json({ fixtures: simplified });
  } catch (error) {
    console.error("Fixtures API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
