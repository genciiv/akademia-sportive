export default function AthletePortalLoading() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="animate-pulse">
          <div className="h-6 w-32 rounded-full bg-slate-200" />

          <div className="mt-5 h-9 w-64 max-w-full rounded-xl bg-slate-200" />

          <div className="mt-3 h-4 w-full max-w-xl rounded-lg bg-slate-100" />

          <div className="mt-2 h-4 w-4/5 max-w-lg rounded-lg bg-slate-100" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <article
            key={index}
            className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="animate-pulse">
              <div className="flex items-center justify-between gap-4">
                <div className="h-5 w-24 rounded-full bg-slate-200" />
                <div className="h-9 w-9 rounded-xl bg-slate-100" />
              </div>

              <div className="mt-5 h-6 w-3/4 rounded-lg bg-slate-200" />

              <div className="mt-3 h-4 w-full rounded-lg bg-slate-100" />

              <div className="mt-2 h-4 w-5/6 rounded-lg bg-slate-100" />

              <div className="mt-6 flex gap-2">
                <div className="h-7 w-20 rounded-full bg-slate-100" />
                <div className="h-7 w-24 rounded-full bg-slate-100" />
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}