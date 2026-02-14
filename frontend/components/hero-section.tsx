import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
     

      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        Convert &amp; Compress
        <br />
        <span className="text-teal">Your Files Instantly</span>
      </h1>

      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        Converting any files types &amp; Comprssing any files sizes
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button
          size="lg"
          className="rounded-full bg-teal text-teal-foreground hover:bg-teal/90"
          asChild
        >
          <Link href="/convert">Converting Files</Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="rounded-full"
          asChild
        >
          <Link href="/compress">Compress Files</Link>
        </Button>
      </div>
    </section>
  );
}
