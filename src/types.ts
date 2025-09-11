 export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  role: Role;
  content: string;
}

export interface GolfData {
  rounds: Record<string, Message[]>;
  roundStats: Record<string, RoundStats>;
  currentRoundId: string | null;
}

export interface HoleStats {
  holeNumber: number;
  par: number;
  score?: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
  putts?: number;
  upAndDown?: boolean;
  photos?: string[];
}

export interface RoundStats {
  roundId: string;
  courseName?: string;
  date: string;
  holes: HoleStats[];
  currentHole: number;
}
