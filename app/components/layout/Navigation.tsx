"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ShareButton } from "../json-formatter/ShareButton";
import { LanguageSelector } from "../LanguageSelector";
import { cn } from "@/lib/utils";
import { useI18nStore } from "@/lib/stores/i18nStore";
import { t } from "@/lib/i18n";

function ActiveIndicator({
  pathname,
  tabs,
}: {
  pathname: string | null;
  tabs: { href: string }[];
}) {
  const [style, setStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const updatePosition = () => {
      const activeTab = tabs.find((tab) =>
        tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href)
      );

      if (!activeTab) return;

      const element = document.getElementById(`nav-tab-${activeTab.href}`);
      if (element) {
        setStyle({
          left: element.offsetLeft,
          width: element.offsetWidth,
          opacity: 1,
        });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [pathname, tabs]);

  return (
    <span
      className="absolute bottom-0 h-0.5 bg-brand-primary-500 transition-all duration-300 ease-out dark:bg-brand-primary-400"
      style={{
        left: style.left,
        width: style.width,
        opacity: style.opacity,
      }}
    />
  );
}

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
    <nav className="flex h-18 items-end justify-between border-b bg-white/80 px-4 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-black/80">
      <div className="flex items-end gap-20 pb-0">
        <Link href="/" className="flex items-center py-4">
          <Image
            src="/logo.png"
            alt="JForm"
            width={488}
            height={108}
            className="h-8 w-auto"
            priority
          />
        </Link>
        <div className="relative flex items-center gap-6">
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                id={`nav-tab-${tab.href}`}
                className={cn(
                  "relative px-[10px] pb-2 text-md font-medium transition-colors",
                  isActive
                    ? "text-brand-primary-500 dark:text-brand-primary-400"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
          <ActiveIndicator pathname={pathname} tabs={tabs} />
        </div>
      </div>
      <div className="flex h-full items-center gap-2">
        <ShareButton />
        <LanguageSelector />
      </div>
    </nav>
  );
}
