import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Packaging Ambassadors"
      width={1024}
      height={1536}
      priority
      className={cn("h-10 w-auto object-contain", className)}
    />
  );
}
