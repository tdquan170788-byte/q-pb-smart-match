import type { GeneratedSchedule } from "./schedule";

export type SessionMode = "normal" | "team";

export type Member = {
  id: string;

  name: string;
  nickname?: string;
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

  /**
   * Số round người dùng mong muốn.
   *
   * Session cũ chưa có giá trị này sẽ tiếp tục dùng
   * công thức mặc định của Scheduler.
   */
  targetRounds?: number;

  teamConfig?: SessionTeamConfig;

  /**
   * Lịch đã được sinh và lưu cố định.
   */
  scheduleSnapshot?: GeneratedSchedule;

  /**
   * Phiên bản Scheduler đã dùng để tạo snapshot.
   */
  schedulerVersion?: string;

  /**
   * Thời điểm lịch được tạo và đóng băng.
   */
  scheduleCreatedAt?: string;
};

export type MemberForm = {
  name: string;
  nickname?: string;
};
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

  /**
   * Số round người dùng mong muốn.
   * Session cũ không có trường này sẽ tiếp tục dùng quy tắc mặc định.
   */
  targetRounds?: number;

  teamConfig?: SessionTeamConfig;

  scheduleSnapshot?: GeneratedSchedule;
  schedulerVersion?: string;
  scheduleCreatedAt?: string;
};

Không cần sửa các type còn lại.

export type MemberForm = {
  name: string;
  nickname?: string;
};
