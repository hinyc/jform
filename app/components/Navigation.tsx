"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { ShareButton } from "./json-formatter/ShareButton";
import { LanguageSelector } from "./LanguageSelector";
import { cn } from "@/lib/utils";
import { useI18nStore } from "@/lib/stores/i18nStore";
import { t } from "@/lib/i18n";

/**
 * height: 72px;
 * @returns
 */
export default function Navigation() {
  const pathname = usePathname();
  const language = useI18nStore((state) => state.language);

  const tabs = useMemo(
    () => [
      {
        href: "/",
        label: t("navigation.formatter", language),
      },
      {
        href: "/diff",
        label: t("navigation.diff", language),
      },
    ],
    [language]
  );

  return (
    <nav className="flex h-18 items-center justify-between border-b bg-white/80 px-4 py-3 shadow-md backdrop-blur-sm dark:border-zinc-800 dark:bg-black/80">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="JForm"
            width={488}
            height={108}
            className="h-10 w-auto"
            priority
          />
        </Link>
        <div className="flex items-center gap-2 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900/60">
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-black dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ShareButton />
        <LanguageSelector />
      </div>
    </nav>
  );
}
