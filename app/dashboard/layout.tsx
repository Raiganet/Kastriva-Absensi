import Sidebar from "./sidebar";
import { DashboardGate } from "@/components/session";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto pt-16 lg:pt-0 px-4 sm:px-6 md:px-8 lg:px-10 py-6 lg:py-8">
        <DashboardGate>{children}</DashboardGate>
      </main>
    </div>
  );
}
