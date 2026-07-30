export default function Loading() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex w-64 flex-col gap-3 p-5 border-r border-white/10">
        <div className="skeleton h-11 w-full rounded-xl" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton h-10 w-full rounded-xl" />
        ))}
      </div>
      <div className="flex-1 p-4 sm:p-6 md:p-8 space-y-6">
        <div className="skeleton h-9 w-64 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-72 rounded-2xl" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    </div>
  );
}
