import type { Metadata } from "next";
import { Discover } from "@/components/Discover";

export const metadata: Metadata = { title: "Discover · Coy" };

export default function DiscoverPage() {
  return <Discover />;
}
