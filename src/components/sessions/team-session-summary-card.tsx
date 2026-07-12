"use client";

import {
  Trophy,
  Flag,
  Target,
} from "lucide-react";

import SectionCard from "@/components/section-card";
import Progress from "@/components/ui/progress";

import type {
  TeamSessionSummary,
} from "@/lib/sessions";

type Props = {
  summary: TeamSessionSummary;
};

export default function TeamSessionSummaryCard({
  summary,
}: Props) {
  if (!summary.isTeamMode) {
    return null;
  }

  return (
    <SectionCard
      title="Kết quả chung cuộc Team"
    >
      <div className="space-y-5">

        <div className="grid grid-cols-3 items-center">

          <TeamSide
            title="Team A"
            wins={summary.teamA.matchWins}
            active={
              summary.winner === "team-a"
            }
          />

          <div className="text-center">

            <div className="text-5xl font-bold">
              {summary.teamA.matchWins}
              {" - "}
              {summary.teamB.matchWins}
            </div>

            <div className="mt-2 text-sm text-slate-500">
              Match Wins
            </div>

          </div>

          <TeamSide
            title="Team B"
            wins={summary.teamB.matchWins}
            active={
              summary.winner === "team-b"
            }
          />

        </div>

        <div>

          <div className="mb-2 flex justify-between text-sm">

            <span>
              Tiến độ
            </span>

            <span>

              {summary.completedMatches}

              /

              {summary.totalScheduledMatches}

            </span>

          </div>

          <Progress
            value={summary.completionPercent}
            max={100}
          />

        </div>

        <div className="grid gap-3 md:grid-cols-2">

          <StatBox
            icon={<Target size={18} />}
            label="Điểm Team A"
            value={`${summary.teamA.pointsFor}`}
          />

          <StatBox
            icon={<Target size={18} />}
            label="Điểm Team B"
            value={`${summary.teamB.pointsFor}`}
          />

          <StatBox
            icon={<Flag size={18} />}
            label="Hiệu số Team A"
            value={summary.teamA.pointDifference}
          />

          <StatBox
            icon={<Flag size={18} />}
            label="Hiệu số Team B"
            value={summary.teamB.pointDifference}
          />

        </div>

        <WinnerBanner
          winner={summary.winner}
        />

      </div>
    </SectionCard>
  );
}

function TeamSide({
  title,
  wins,
  active,
}:{
  title:string;
  wins:number;
  active:boolean;
}){

  return(

    <div className="text-center">

      <div
        className={
          active
            ? "text-brand-600 font-bold"
            : "font-semibold"
        }
      >
        {title}
      </div>

      <div className="mt-2 text-3xl font-bold">
        {wins}
      </div>

    </div>

  );

}

function WinnerBanner({
  winner,
}:{
  winner:
    |"team-a"
    |"team-b"
    |"draw"
    |"pending";
}){

  if(winner==="pending"){

    return(

      <div className="rounded-2xl bg-slate-100 p-4 text-center">

        Chưa kết thúc session

      </div>

    );

  }

  if(winner==="draw"){

    return(

      <div className="rounded-2xl bg-yellow-50 p-4 text-center font-semibold">

        Hai đội hòa nhau

      </div>

    );

  }

  return(

    <div className="rounded-2xl bg-emerald-50 p-4">

      <div className="flex items-center justify-center gap-2 font-bold text-emerald-700">

        <Trophy size={20}/>

        {winner==="team-a"
          ? "Team A chiến thắng"
          : "Team B chiến thắng"}

      </div>

    </div>

  );

}

function StatBox({
  icon,
  label,
  value,
}:{
  icon:React.ReactNode;
  label:string;
  value:string|number;
}){

  return(

    <div className="rounded-2xl border p-4">

      <div className="flex items-center gap-2 text-slate-500">

        {icon}

        {label}

      </div>

      <div className="mt-2 text-2xl font-bold">

        {value}

      </div>

    </div>

  );

}
