import { NextRequest, NextResponse } from "next/server";
import { getFixtureById, mapFixtureStatus } from "@/lib/sports-api";
import { submitOracleResult, settleBet, getOracleResult } from "@/lib/near";

/**
 * POST /api/oracle/update
 *
 * Fetches a game result from API-Football and submits it to the oracle contract.
 * Optionally settles a bet if bet_id is provided.
 *
 * Body: { fixture_id: number, bet_id?: string, winning_option?: number }
 */
export async function POST(request: NextRequest) {
  try {
    // Simple auth check — in production use a proper secret
    const authHeader = request.headers.get("x-oracle-secret");
    if (authHeader !== process.env.ORACLE_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fixture_id, bet_id, winning_option } = body;

    if (!fixture_id) {
      return NextResponse.json({ error: "fixture_id is required" }, { status: 400 });
    }

    // 1. Fetch game result from API-Football
    const fixture = await getFixtureById(fixture_id);
    if (!fixture) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 });
    }

    const eventId = String(fixture.fixture.id);
    const status = mapFixtureStatus(fixture.fixture.status.short);

    // 2. Submit result to oracle contract
    await submitOracleResult(
      eventId,
      fixture.teams.home.name,
      fixture.teams.away.name,
      fixture.goals.home ?? 0,
      fixture.goals.away ?? 0,
      status
    );

    // 3. Optionally settle a bet
    let settled = false;
    if (bet_id && winning_option !== undefined && status === "finished") {
      await settleBet(bet_id, winning_option);
      settled = true;
    }

    return NextResponse.json({
      success: true,
      event_id: eventId,
      home_team: fixture.teams.home.name,
      away_team: fixture.teams.away.name,
      home_score: fixture.goals.home,
      away_score: fixture.goals.away,
      status,
      settled,
    });
  } catch (error) {
    console.error("Oracle update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/oracle/update?event_id=123
 *
 * Read a result from the oracle contract.
 */
export async function GET(request: NextRequest) {
  try {
    const eventId = request.nextUrl.searchParams.get("event_id");
    if (!eventId) {
      return NextResponse.json({ error: "event_id is required" }, { status: 400 });
    }

    const result = await getOracleResult(eventId);
    if (!result) {
      return NextResponse.json({ error: "No result found" }, { status: 404 });
    }

    return NextResponse.json({ result: JSON.parse(result) });
  } catch (error) {
    console.error("Oracle read error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
