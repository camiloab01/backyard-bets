// Shared types between frontend and contracts

export interface Party {
  id: string;
  name: string;
  creator: string;
  members: string[];
  inviteCode: string;
  createdAt: string; // nanosecond timestamp as string (bigint serialization)
  isActive: boolean;
}

export interface Bet {
  id: string;
  partyId: string;
  creator: string;
  eventId: string;
  description: string;
  options: string[];
  deadline: string; // nanosecond timestamp as string
  status: BetStatus;
  totalPool: string; // yoctoNEAR as string
  winningOption: number | null;
}

export type BetStatus = "open" | "closed" | "settled";

export interface Wager {
  betId: string;
  user: string;
  optionIndex: number;
  amount: string; // yoctoNEAR as string
  timestamp: string; // nanosecond timestamp as string
}

export interface GameResult {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: GameStatus;
  timestamp: string; // nanosecond timestamp as string
}

export type GameStatus = "scheduled" | "live" | "finished";
