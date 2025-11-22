import type { Metadata } from "next";
import { DiffViewer } from "../components/json-diff/DiffViewer";

export const metadata: Metadata = {
  title: "JSON Diff | JForm",
  description:
    "Compare two JSON objects side-by-side and highlight differences.",
};

export default function DiffPage() {
  return (
    <div className="flex min-h-screen bg-zinc-50 pb-12 pt-24 font-sans dark:bg-black">
      <div className="w-full px-4">
        <DiffViewer />
      </div>
    </div>
  );
}
