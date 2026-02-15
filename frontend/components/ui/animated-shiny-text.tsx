import { cn } from "@/lib/utils";

export function AnimatedShinyText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "animate-shiny-text bg-clip-text bg-[length:250%_100%] bg-[linear-gradient(110deg,transparent,35%,rgba(255,255,255,0.7),45%,transparent)] bg-no-repeat",
        className,
      )}
    >
      {children}
    </span>
  );
}
