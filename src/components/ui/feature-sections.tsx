import Image from "next/image";
import type { ReactNode } from "react";

export type FeatureChain = {
  name: string;
  logo?: string;
};

export type FeatureCard = {
  id: string;
  protocol: string;
  chains: FeatureChain[];
  extraChains?: number;
  aprRange: string;
  logo: string;
  tint: string;
};

type FeatureSectionsProps = {
  eyebrow?: string;
  eyebrowIcon?: ReactNode;
  title: string;
  description?: ReactNode;
  cards: FeatureCard[];
  footer?: ReactNode;
  columns?: 2 | 3;
};

const COLUMN_CLASS: Record<2 | 3, string> = {
  2: "grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
};

export function FeatureSections({
  eyebrow,
  eyebrowIcon,
  title,
  description,
  cards,
  footer,
  columns = 2,
}: FeatureSectionsProps) {
  const isVertical = columns === 3;

  return (
    <section className="relative h-[62%] flex-col overflow-hidden rounded-sm border border-main bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-2">
        {eyebrow ? (
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">
            {eyebrowIcon}
            {eyebrow}
          </span>
        ) : null}
        <h2 className="max-w-[22ch] text-xl font-semibold leading-tight tracking-tight text-main sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-md text-sm text-muted">{description}</p>
        ) : null}
      </div>

      <div
        className={`mt-4 grid flex-1 gap-2.5 sm:gap-3 ${COLUMN_CLASS[columns]}`}
      >
        {cards.map((card) =>
          isVertical ? (
            <VerticalCard key={card.id} card={card} />
          ) : (
            <HorizontalCard key={card.id} card={card} />
          ),
        )}
      </div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </section>
  );
}

function VerticalCard({ card }: { card: FeatureCard }) {
  return (
    <div
      className="relative flex flex-col items-center gap-3 overflow-hidden rounded-sm border border-(--color-line)/40 p-4 text-center"
      style={{ backgroundColor: card.tint }}
    >
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-white/10 ring-1 ring-white/10">
        <Image
          src={card.logo}
          alt={card.protocol}
          fill
          sizes="30px"
          className="object-contain"
        />
      </span>
      <span className="w-full truncate text-sm font-semibold text-main">
        {card.protocol}
      </span>
      <span className="flex items-center gap-1 text-[11px] text-muted">
        {card.chains[0]?.logo ? (
          <Image
            src={card.chains[0].logo}
            alt={card.chains[0].name}
            width={12}
            height={12}
            className="h-3 w-3 shrink-0 rounded-full object-cover"
          />
        ) : null}
        <span>{card.chains[0]?.name}</span>
        {card.chains.length > 1 ? (
          <span className="text-faint">+{card.chains.length - 1}</span>
        ) : null}
        {card.extraChains && card.extraChains > 0 ? (
          <span className="text-faint">+{card.extraChains}</span>
        ) : null}
      </span>
      <div className="mt-auto inline-flex items-baseline gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-main">
        {card.aprRange}
        <span className="text-[9px] font-bold uppercase tracking-wide text-faint">
          APY
        </span>
      </div>
    </div>
  );
}

function HorizontalCard({ card }: { card: FeatureCard }) {
  return (
    <div
      className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-sm border border-white/20 p-6"
      style={{ backgroundColor: card.tint }}
    >
      <div className="flex items-center gap-3">
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-sm border border-white/10">
          <Image
            src={card.logo}
            alt={card.protocol}
            fill
            sizes="44px"
            className="object-contain"
          />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-main">
            {card.protocol}
          </span>
          <span className="flex items-center gap-1 truncate text-[11px] text-muted">
            {card.chains.map((chain, index) => (
              <span key={chain.name} className="flex items-center gap-1">
                {index > 0 ? <span className="text-faint">·</span> : null}
                {chain.logo ? (
                  <Image
                    src={chain.logo}
                    alt={chain.name}
                    width={12}
                    height={12}
                    className="h-3 w-3 shrink-0 object-contain"
                  />
                ) : null}
                <span>{chain.name}</span>
              </span>
            ))}
            {card.extraChains && card.extraChains > 0 ? (
              <span className="flex items-center gap-1">
                <span className="text-faint">·</span>
                <span className="text-faint">+{card.extraChains}</span>
              </span>
            ) : null}
          </span>
        </div>
      </div>

      <div>
        <span className="inline-flex items-baseline gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-main">
          {card.aprRange}
          <span className="text-[9px] font-bold uppercase tracking-wide text-faint">
            APY
          </span>
        </span>
      </div>
    </div>
  );
}
