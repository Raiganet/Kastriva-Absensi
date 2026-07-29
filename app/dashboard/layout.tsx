import Sidebar from "./sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10">
        {children}
      </main>
    </div>
  );
}
