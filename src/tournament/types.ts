export interface TourPlayer {
  id: string;
  name: string;
  ghinNumber?: string;
  handicapIndex: number; // e.g. 12.4
  courseHandicap: number; // whole strokes
  teeTime?: string;
}

export interface TourHole {
  number: number;
  par: number;
  handicapRating: number; // stroke index 1-18
  yards?: number;
}

export interface TourGroup {
  id: string;
  name: string; // e.g. "Group 1" or "Tee Time 9:00"
  playerIds: string[];
  teeTime?: string;
}

export type TournamentFormat = 'stroke' | 'stableford' | 'both';

export type PlayDay = 'friday' | 'sunday';

export interface Tournament {
  id: string;
  name: string;
  courseName: string;
  courseId?: string; // which saved-library course is loaded (for the picker)
  courseRating?: number; // course rating (optional; falls back to legacy handicap calc)
  courseSlope?: number; // slope rating (optional; defaults to 113 = index as-is)
  date: string; // ISO date (YYYY-MM-DD)
  playDay?: PlayDay; // optional weekly tag: friday/sunday play
  holes: TourHole[];
  players: Record<string, TourPlayer>;
  groups: TourGroup[];
  // groupId -> playerId -> holeNumber -> gross score
  scores: Record<string, Record<string, Record<number, number>>>;
  format: TournamentFormat;
  handicapAllowance: number; // 100 = full, 85 = 85%, etc.
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  groupName: string;
  thru: number; // holes completed
  grossTotal: number; // sum of gross on played holes
  grossToPar: number;
  netTotal: number;
  netToPar: number;
  stableford: number;
  position: number;
}
