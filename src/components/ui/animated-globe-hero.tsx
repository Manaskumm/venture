import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedGlobeHeroProps {
  titlePrefix: string;
  animatedWords: string[];
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  badgeText?: string;
  globeSrc: string;
  className?: string;
}

export const AnimatedGlobeHero = ({
  titlePrefix,
  animatedWords,
  subtitle,
  ctaText,
  ctaLink,
  badgeText,
  globeSrc,
  className,
}: AnimatedGlobeHeroProps) => {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % animatedWords.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [animatedWords.length]);

  return (
    <section
      className={cn(
        "relative w-full min-h-screen flex flex-col items-center justify-center text-center overflow-hidden bg-background p-4 md:p-8",
        className
      )}
    >
      <div className="z-10 flex flex-col items-center space-y-6 md:space-y-8 max-w-4xl mx-auto">
        {badgeText && (
          <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium text-muted-foreground border border-white/10 glass-panel">
            {badgeText}
          </div>
        )}

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-foreground text-balance">
          {titlePrefix}{" "}
          <div className="inline-block relative h-[1.2em] w-[280px] md:w-[450px] lg:w-[600px] overflow-hidden align-bottom">
            <AnimatePresence mode="wait">
              <motion.span
                key={animatedWords[index]}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 text-blue-500 whitespace-nowrap"
              >
                {animatedWords[index]}
              </motion.span>
            </AnimatePresence>
            <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-500/30 rounded-full" />
          </div>
        </h1>

        <p className="max-w-xl text-base md:text-xl text-muted-foreground">
          {subtitle}
        </p>

        <a
          href={ctaLink}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-12 px-8 bg-blue-600 text-white hover:bg-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
        >
          {ctaText}
        </a>
      </div>

      <div className="absolute -bottom-[25%] md:-bottom-[40%] lg:-bottom-[50%] -z-0 w-full max-w-screen-lg opacity-40 dark:opacity-30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={globeSrc}
          alt="Rotating Earth Globe"
          className="w-full h-auto animate-globe-spin"
        />
      </div>
    </section>
  );
};
