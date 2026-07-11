import type { GeneratedSchedule } from "./schedule";

export type SessionMode = "normal" | "team";

export type Member = {
  id: string;

  name: string;
  nickname?: string;

  createdAt: string;

  rating: number;
  wins: number;
  losses: number;
  matches: number;

  ratingNormal: number;
  winsNormal: number;
  lossesNormal: number;
  matchesNormal: number;
  pointsForNormal: number;
  pointsAgainstNormal: number;

  ratingTeam: number;
  winsTeam: number;
  lossesTeam: number;
  matchesTeam: number;
  pointsForTeam: number;
  pointsAgainstTeam: number;
};

export type MatchSide = {
  memberIds: string[];
};

export type MatchRecord = {
  id: string;

  sessionId: string;

  round: number;
  court?: number;

  teamA: MatchSide;
  teamB: MatchSide;

  scoreA: number;
  scoreB: number;

  createdAt?: string;
};

export type SessionTeamConfig = {
  teamAMemberIds: string[];
  teamBMemberIds: string[];
};

export type SessionRecord = {
  id: string;

  date: string;
  pointToWin: number;
  memberIds: string[];

  createdAt: string;

  mode: SessionMode;
  courtCount?: number;

  teamConfig?: SessionTeamConfig;

  /**
   * Lịch đấu đã được sinh và đóng băng tại thời điểm tạo session.
   *
   * Session cũ có thể chưa có trường này. Khi đó hệ thống sẽ sinh lịch
   * một lần rồi lưu lại ở bước migration tiếp theo.
   */
  scheduleSnapshot?: GeneratedSchedule;

  /**
   * Phiên bản thuật toán đã dùng để sinh scheduleSnapshot.
   * Ví dụ: "smart-scheduler-2.1".
   */
  schedulerVersion?: string;

  /**
   * Thời điểm lịch được sinh và đóng băng.
   */
  scheduleCreatedAt?: string;
};

export type MemberForm = {
  name: string;
  nickname?: string;
};
