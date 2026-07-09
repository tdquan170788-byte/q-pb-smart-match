"use client";

import AppShell from "@/components/app-shell";
import SectionCard from "@/components/section-card";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Thiết lập ứng dụng">
      <div className="space-y-4">
        <SectionCard title="Sprint 5">
          <div className="space-y-2 text-sm text-slate-600">
            <div>• Bản hiện tại đang dùng localStorage trên thiết bị.</div>
            <div>• Giai đoạn sau có thể bổ sung export/import dữ liệu.</div>
            <div>• Có thể thêm tuỳ chọn reset toàn bộ app.</div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}