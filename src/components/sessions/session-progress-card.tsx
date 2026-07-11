import Badge from "@/components/ui/badge";
import Progress from "@/components/ui/progress";

import type {
    SessionProgress,
} from "@/types";

import {
    getSessionProgressLabel,
} from "@/lib/sessions";

type Props = {
    progress: SessionProgress;
};

export default function SessionProgressCard({
    progress,
}: Props) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">

            <div className="flex items-center justify-between">

                <div>

                    <div className="text-lg font-bold">
                        Tiến độ Session
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                        Theo dõi trạng thái thi đấu hiện tại
                    </div>

                </div>

                <Badge variant="info">
                    {getSessionProgressLabel(progress.status)}
                </Badge>

            </div>

            <div className="mt-5">

                <Progress
                    value={progress.completionPercent}
                    max={100}
                />

                <div className="mt-2 text-right text-sm text-slate-500">
                    {progress.completionPercent.toFixed(1)}%
                </div>

            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">

                <ProgressMetric
                    title="Round hiện tại"
                    value={
                        progress.currentRound ??
                        "-"
                    }
                />

                <ProgressMetric
                    title="Round tiếp"
                    value={
                        progress.nextRound ??
                        "-"
                    }
                />

                <ProgressMetric
                    title="Trận"
                    value={`${progress.completedMatches}/${progress.totalMatches}`}
                />

                <ProgressMetric
                    title="Round"
                    value={`${progress.completedRounds}/${progress.totalRounds}`}
                />

            </div>

        </div>
    );
}

function ProgressMetric({
    title,
    value,
}:{
    title:string;
    value:string|number;
}){

    return(

        <div className="rounded-2xl bg-slate-50 p-4">

            <div className="text-xs text-slate-500">
                {title}
            </div>

            <div className="mt-2 text-2xl font-bold">
                {value}
            </div>

        </div>

    );

}