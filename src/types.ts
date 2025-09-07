
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  role: Role;
  content: string;
}

export interface GolfData {
  rounds: Record<string, Message[]>; // Key is roundId (e.g., timestamp string)
  currentRoundId: string | null;
}
