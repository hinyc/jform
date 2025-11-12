import Image from "next/image";
import Link from "next/link";
import React from "react";
import { ShareButton } from "./json-formatter/ShareButton";
import { LanguageSelector } from "./LanguageSelector";

/**
 * height: 72px;
 * @returns
 */
export default function Navigation() {
  return (
    <nav className=" flex items-center justify-between p-4 h-18 bg-white dark:bg-black shadow-md">
      <Link href="/">
        <Image
          src="/logo.png"
          alt="JForm"
          width={488}
          height={108}
          className="w-auto h-10"
        />
      </Link>
      <div className="flex items-center gap-2">
        <ShareButton />
        <LanguageSelector />
      </div>
    </nav>
  );
}
