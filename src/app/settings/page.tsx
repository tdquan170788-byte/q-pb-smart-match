"use client";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";

export default function SettingsPage() {
  return (
    <AppShell
      title="Cài đặt"
      subtitle="Thiết lập Q-PB Smart Match"
    >
      <div className="space-y-4">
        <SectionCard title="Lưu trữ dữ liệu">
          <div className="space-y-2 text-sm text-slate-600">
            <div>• Dữ liệu hiện được lưu bằng localStorage trên thiết bị.</div>
            <div>• Dự kiến bổ sung Export / Import dữ liệu.</div>
            <div>• Dự kiến bổ sung sao lưu và khôi phục dữ liệu.</div>
            <div>• Dự kiến bổ sung chức năng Reset toàn bộ ứng dụng.</div>
          </div>
        </SectionCard>

        <SectionCard title="Phiên bản">
          <div className="text-sm text-slate-600">
            Q-PB Smart Match — Sprint 6 (Refactor Architecture)
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
