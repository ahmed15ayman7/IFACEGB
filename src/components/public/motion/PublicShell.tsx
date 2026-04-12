"use client";

import { PublicAmbient } from "./PublicAmbient";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  ambient?: "default" | "dense" | "minimal";
};

/** Standard public page wrapper: relative section + animated ambient + z-stacked content. */
export function PublicShell({ children, className, ambient = "default" }: Props) {
  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <PublicAmbient variant={ambient} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
