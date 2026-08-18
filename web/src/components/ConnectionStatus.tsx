import clsx from "clsx";

export function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] tracking-wide",
        connected ? "border-phosphor/30 bg-phosphor/10 text-phosphor" : "border-crimson/30 bg-crimson/10 text-crimson"
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          connected ? "bg-phosphor animate-pulseline" : "bg-crimson"
        )}
      />
      {connected ? "LIVE" : "RECONNECTING"}
    </div>
  );
}
