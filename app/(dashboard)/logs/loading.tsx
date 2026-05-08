import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      {/* nav bar */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-16 ml-auto rounded-md" />
      </div>

      {/* calendar grid */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-5 divide-x divide-border">
          {[
            [110, 70],
            [],
            [160],
            [220, 90],
            [],
          ].map((heights, i) => (
            <div key={i} className="flex flex-col">
              <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="p-2 flex flex-col gap-2 min-h-[500px]">
                {(heights as number[]).map((h, j) => (
                  <Skeleton key={j} style={{ height: h }} className="rounded-xl w-full flex-shrink-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
