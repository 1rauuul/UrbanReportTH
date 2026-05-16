import { SYNC_STATUS_LABELS, type SyncStatus } from "@/lib/mock-data";

const styles: Record<SyncStatus, string> = {
  synced: "bg-success/15 text-success border-success/25",
  pending_sync: "bg-warning/15 text-[#7a5610] border-warning/30",
  syncing: "bg-primary/10 text-primary border-primary/20",
  sync_failed: "bg-danger/15 text-danger border-danger/30",
};

export default function SyncBadge({
  status,
  className = "",
}: {
  status: SyncStatus;
  className?: string;
}) {
  if (status === "synced") return null;
  return (
    <span
      className={[
        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold uppercase",
        styles[status],
        className,
      ].join(" ")}
    >
      {SYNC_STATUS_LABELS[status]}
    </span>
  );
}
