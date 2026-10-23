import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  icon?: string;
}

export default function EmptyState({
  title,
  description,
  actionText = "Explore Learning Paths",
  actionHref = "/explore",
}: EmptyStateProps) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-space-xl text-center flex flex-col items-center justify-center gap-space-md shadow-sm border border-surface-container-high/60 my-space-md">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
        {/* Pencil-Line Vector Icon */}
        <svg
          className="w-8 h-8 text-primary"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
          viewBox="0 0 24 24"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
          <path d="M4 22h16" />
        </svg>
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="font-headline-md text-headline-md text-primary font-serif">
          {title}
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          {description}
        </p>
      </div>

      {actionText && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1.5 bg-primary-container text-on-primary hover:bg-primary px-space-lg py-2.5 rounded-lg font-label-lg text-label-lg transition-all shadow-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-base">explore</span>
          <span>{actionText}</span>
        </Link>
      )}
    </div>
  );
}
