import { cn } from "@/lib/utils";

type WaveProps = {
  fillClassName?: string;
  flip?: boolean;
  className?: string;
};

export function Wave({ fillClassName = "fill-sand-100", flip = false, className }: WaveProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none w-full overflow-hidden leading-[0]", className)}
    >
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className={cn("h-16 w-full sm:h-20", flip && "rotate-180")}
      >
        <path
          className={fillClassName}
          d="M0,32 C240,80 480,0 720,24 C960,48 1200,88 1440,40 L1440,90 L0,90 Z"
        />
      </svg>
    </div>
  );
}
