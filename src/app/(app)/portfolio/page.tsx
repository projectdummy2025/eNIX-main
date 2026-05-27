import type { Metadata } from "next";
import { PortfolioView } from "@/components/pages/(app)";

export const metadata: Metadata = {
  title: "eNIX App | Portfolio",
};

export default function PortfolioPage() {
  return <PortfolioView />;
}
