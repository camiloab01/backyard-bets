import { Account, JsonRpcProvider, KeyPairSigner } from "near-api-js";
import fs from "fs";
import path from "path";
import { homedir } from "os";

const NETWORK_ID = process.env.NEAR_NETWORK || "testnet";
const BETS_CONTRACT_ID = process.env.BETS_CONTRACT_ID || "bets.backyard-bets.testnet";
const ORACLE_CONTRACT_ID = process.env.ORACLE_CONTRACT_ID || "oracle.backyard-bets.testnet";
const ORACLE_ACCOUNT_ID = process.env.ORACLE_ACCOUNT_ID || "backyard-bets.testnet";
const RPC_URL = `https://rpc.${NETWORK_ID}.near.org`;

/** Load a KeyPairSigner from ~/.near-credentials */
function loadSigner(accountId: string): KeyPairSigner {
  const credPath = path.join(homedir(), ".near-credentials", NETWORK_ID, `${accountId}.json`);
  const creds = JSON.parse(fs.readFileSync(credPath, "utf-8"));
  return KeyPairSigner.fromSecretKey(creds.private_key || creds.secret_key);
}

/** Get the oracle account for submitting results */
export function getOracleAccount(): Account {
  const provider = new JsonRpcProvider({ url: RPC_URL });
  const signer = loadSigner(ORACLE_ACCOUNT_ID);
  return new Account(ORACLE_ACCOUNT_ID, provider, signer);
}

/** Get a read-only provider for view calls */
export function getProvider(): JsonRpcProvider {
  return new JsonRpcProvider({ url: RPC_URL });
}

/** Submit a game result to the oracle contract */
export async function submitOracleResult(
  eventId: string,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
  status: string
): Promise<void> {
  const account = getOracleAccount();

  await account.callFunction({
    contractId: ORACLE_CONTRACT_ID,
    methodName: "submit_result",
    args: {
      event_id: eventId,
      home_team: homeTeam,
      away_team: awayTeam,
      home_score: homeScore,
      away_score: awayScore,
      status,
    },
  });
}

/** Read a result from the oracle contract */
export async function getOracleResult(eventId: string): Promise<string | null> {
  const provider = getProvider();

  const result = await provider.callFunction<string>({
    contractId: ORACLE_CONTRACT_ID,
    method: "get_result",
    args: { event_id: eventId },
  });

  return result ?? null;
}

/** Settle a bet on the bets contract */
export async function settleBet(betId: string, winningOption: number): Promise<void> {
  const account = getOracleAccount();

  await account.callFunction({
    contractId: BETS_CONTRACT_ID,
    methodName: "settle_bet",
    args: { bet_id: betId, winning_option: winningOption },
  });
}

export { BETS_CONTRACT_ID, ORACLE_CONTRACT_ID, NETWORK_ID };
