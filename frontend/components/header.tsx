"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Minimize2, Clock, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "/convert", label: "Convert", icon: ArrowLeftRight },
  { href: "/compress", label: "Compress", icon: Minimize2 },
  { href: "/history", label: "History", icon: Clock },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-teal" />
          <span className="text-lg font-semibold">FileForge</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors hover:text-foreground ${
                pathname === href
                  ? "text-teal font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
