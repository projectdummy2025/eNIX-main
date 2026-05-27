export type YieldPeriod = "year" | "month" | "week" | "day";

export const TOKEN_LOGO_FALLBACKS: Record<string, string> = {
  USDT: "/Assets/Images/Logo-Coin/usdt-logo.svg",
};

export const YIELD_PERIODS: {
  key: YieldPeriod;
  label: string;
  divisor: number;
  suffix: string;
  title: string;
  hintLabel: string;
  hintDivisor: number;
}[] = [
  {
    key: "year",
    label: "1Y",
    divisor: 1,
    suffix: "/ year",
    title: "Estimated yearly yield",
    hintLabel: "month",
    hintDivisor: 12,
  },
  {
    key: "month",
    label: "1M",
    divisor: 12,
    suffix: "/ month",
    title: "Estimated monthly yield",
    hintLabel: "day",
    hintDivisor: 12 * 30,
  },
  {
    key: "week",
    label: "1W",
    divisor: 52,
    suffix: "/ week",
    title: "Estimated weekly yield",
    hintLabel: "day",
    hintDivisor: 52 * 7,
  },
  {
    key: "day",
    label: "1D",
    divisor: 365,
    suffix: "/ day",
    title: "Estimated daily yield",
    hintLabel: "hour",
    hintDivisor: 365 * 24,
  },
];
