import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";

export default function SettingsPage() {
  return (
    <AppShell title="Cài đặt" subtitle="Q-PB Smart Match">
      <div className="space-y-4">
        <SectionCard title="Phiên bản">
          <p className="text-sm text-slate-600">MVP v0.1 – local storage</p>
        </SectionCard>

        <SectionCard title="Kế hoạch tiếp theo">
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>CRUD thành viên</li>
            <li>Tạo buổi chơi thật</li>
            <li>AI chia đội cơ bản</li>
            <li>Nhập điểm trận đấu</li>
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}