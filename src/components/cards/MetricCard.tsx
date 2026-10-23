interface MetricCardProps {
  category: string;
  title: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon: string;
  iconBgClass?: string;
  progressPercent?: number;
  trend?: string;
}

export default function MetricCard({
  category,
  title,
  value,
  unit,
  subtext,
  icon,
  iconBgClass = "bg-surface-container text-primary",
  progressPercent,
  trend,
}: MetricCardProps) {
  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-surface-container-high/60">
      <div className="flex items-start justify-between">
        <div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
            {category}
          </span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1 font-sans">
            {title}
          </h3>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBgClass}`}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
      </div>

      <div className="mt-space-md">
        <div className="flex items-baseline gap-2">
          <span className="font-display-lg text-display-lg text-primary font-serif">
            {value}
          </span>
          {unit && (
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">
              {unit}
            </span>
          )}
        </div>

        {progressPercent !== undefined && (
          <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {subtext && (
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-tight">
            {subtext}
          </p>
        )}

        {trend && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 font-label-sm text-label-sm text-secondary font-medium">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
}
