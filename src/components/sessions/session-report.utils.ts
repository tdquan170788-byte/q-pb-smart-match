import type {
  Member,
} from "@/types";

import type {
  PlayerSessionSummary,
} from "@/lib/statistics/session-summary";

export function rankSessionPlayers({
  players,
  memberMap,
}: {
  players: PlayerSessionSummary[];

  memberMap: Map<
    string,
    Member
  >;
}): PlayerSessionSummary[] {
  return [...players].sort(
    (firstPlayer, secondPlayer) => {
      if (
        firstPlayer.wins !==
        secondPlayer.wins
      ) {
        return (
          secondPlayer.wins -
          firstPlayer.wins
        );
      }

      if (
        firstPlayer.winRate !==
        secondPlayer.winRate
      ) {
        return (
          secondPlayer.winRate -
          firstPlayer.winRate
        );
      }

      if (
        firstPlayer.pointDiff !==
        secondPlayer.pointDiff
      ) {
        return (
          secondPlayer.pointDiff -
          firstPlayer.pointDiff
        );
      }

      if (
        firstPlayer.pointsFor !==
        secondPlayer.pointsFor
      ) {
        return (
          secondPlayer.pointsFor -
          firstPlayer.pointsFor
        );
      }

      const firstName =
        memberMap.get(
          firstPlayer.memberId
        )?.name ??
        firstPlayer.memberId;

      const secondName =
        memberMap.get(
          secondPlayer.memberId
        )?.name ??
        secondPlayer.memberId;

      return firstName.localeCompare(
        secondName,
        "vi"
      );
    }
  );
}

export function formatSessionRecord(
  player: PlayerSessionSummary
): string {
  return `${player.wins}-${player.losses}-${player.draws}`;
}

export function formatSessionPercent(
  value: number
): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toFixed(1).replace(
    ".0",
    ""
  );
}

export function formatSignedNumber(
  value: number
): string {
  if (value > 0) {
    return `+${value}`;
  }

  return `${value}`;
}
