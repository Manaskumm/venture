'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type AnchorOrButton =
  | ({
      href: string;
      onClick?: never;
    } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({
      href?: undefined;
      onClick?: React.MouseEventHandler<HTMLButtonElement>;
    } & React.ButtonHTMLAttributes<HTMLButtonElement>);

export type TimelineItem = {
  label?: string;
  caption?: string;
  active?: boolean;
} & AnchorOrButton;

export type TimelineRailProps = {
  items: TimelineItem[];
  size?: 'sm' | 'md';
  emphasizeActiveTrail?: boolean;
  labelAngle?: number;
  gapClassName?: string;
  lineColorClass?: string;
  lineThickness?: number;
  dotClass?: string;
  dotActiveClass?: string;
  className?: string;
  railClassName?: string;
  itemClassName?: string;
  labelClassName?: string;
  captionClassName?: string;
  contentStyle?: React.CSSProperties;
  renderLabel?: (item: TimelineItem, index: number) => React.ReactNode;
  renderCaption?: (item: TimelineItem, index: number) => React.ReactNode;
};

export default function TimelineRail({
  items,
  size = 'md',
  emphasizeActiveTrail = true,
  labelAngle = 45,
  gapClassName = 'gap-14',
  lineColorClass = 'bg-zinc-200 dark:bg-zinc-800',
  lineThickness = 4,
  dotClass = 'bg-zinc-300 dark:bg-zinc-700',
  dotActiveClass = 'bg-blue-600 dark:bg-blue-500',
  className,
  railClassName,
  itemClassName,
  labelClassName,
  captionClassName,
  contentStyle,
  renderLabel,
  renderCaption,
}: TimelineRailProps) {
  const lastActive = React.useMemo(() => {
    let idx = -1;
    items.forEach((it, i) => {
      if (it.active) idx = i;
    });
    return idx;
  }, [items]);

  const dotSize = size === 'sm' ? 14 : 18;
  const topOffset = size === 'sm' ? -22 : -26;

  return (
    <section aria-label='timeline' className={cn('relative w-full overflow-x-auto py-12 px-6', className)}>
      {/* Rail */}
      <div
        aria-hidden
        className={cn('absolute left-6 right-6 min-w-[calc(100%-3rem)]', railClassName)}
        style={{
          top: '50%',
          height: lineThickness,
          transform: 'translateY(-50%)',
          ...contentStyle,
        }}
      >
        <div className={cn('h-full rounded-full', lineColorClass)} />

        {emphasizeActiveTrail && lastActive >= 0 && (
          <div
            className='absolute left-0 top-0 h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-500 ease-in-out'
            style={{
              width: `${items.length > 1 ? (lastActive / (items.length - 1)) * 100 : 0}%`,
            }}
          />
        )}
      </div>

      {/* Dots row */}
      <ol
        className={cn(
          'relative flex items-center justify-between',
          gapClassName
        )}
        style={contentStyle}
        role='list'
      >
        {items.map((item, i) => {
          const isActive = !!item.active;
          return (
            <li
              key={i}
              className={cn(
                'relative flex flex-col items-center z-10',
                itemClassName
              )}
            >
              {/* top label */}
              {item.label && (
                <span
                  className={cn(
                    'absolute select-none text-[13px] font-medium whitespace-nowrap text-zinc-500 dark:text-zinc-400',
                    isActive && 'text-zinc-900 dark:text-zinc-100',
                    labelClassName
                  )}
                  style={{
                    top: topOffset - 10,
                    transform: `rotate(${-Math.abs(labelAngle)}deg)`,
                    transformOrigin: 'bottom center',
                  }}
                  aria-hidden
                >
                  {renderLabel ? renderLabel(item, i) : item.label}
                </span>
              )}

              {/* dot */}
              {item.href ? (
                <a
                  href={item.href}
                  className={cn(
                    'relative rounded-full ring-4 ring-white dark:ring-zinc-950 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 hover:scale-125',
                    isActive ? dotActiveClass : dotClass
                  )}
                  style={{ width: dotSize, height: dotSize }}
                  aria-current={isActive ? 'step' : undefined}
                />
              ) : (
                <button
                  type='button'
                  onClick={item.onClick}
                  className={cn(
                    'relative rounded-full ring-4 ring-white dark:ring-zinc-950 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 hover:scale-125',
                    isActive ? dotActiveClass : dotClass
                  )}
                  style={{ width: dotSize, height: dotSize }}
                  aria-current={isActive ? 'step' : undefined}
                />
              )}

              {/* bottom caption */}
              {item.caption && (
                <span
                  className={cn(
                    'absolute select-none text-xs whitespace-nowrap text-zinc-600 dark:text-zinc-500',
                    captionClassName
                  )}
                  style={{ top: dotSize + 10 }}
                  aria-hidden
                >
                  {renderCaption ? renderCaption(item, i) : item.caption}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
