"use client";

import * as React from "react";

interface LoaderProps {
  size?: number; 
  text?: string;
}

export const AILoader: React.FC<LoaderProps> = ({ size = 180, text = "Architecting" }) => {
  const letters = text.split("");

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f0f0f]">
      {/* Background depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent pointer-events-none" />
      
      <div
        className="relative flex items-center justify-center font-bold select-none tracking-[0.2em]"
        style={{ width: size, height: size }}
      >
        <div className="flex gap-1">
          {letters.map((letter, index) => (
            <span
              key={index}
              className="inline-block text-white opacity-40 animate-loaderLetter"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {letter}
            </span>
          ))}
        </div>

        <div
          className="absolute inset-0 rounded-full animate-loaderCircle border border-white/5"
        ></div>
      </div>

      <style jsx>{`
        @keyframes loaderCircle {
          0% {
            transform: rotate(0deg);
            box-shadow:
              0 4px 10px 0 rgba(56, 189, 248, 0.4) inset,
              0 8px 15px 0 rgba(0, 93, 255, 0.3) inset,
              0 20px 30px 0 rgba(30, 64, 175, 0.2) inset;
          }
          50% {
            transform: rotate(180deg);
            box-shadow:
              0 4px 10px 0 rgba(96, 165, 250, 0.4) inset,
              0 8px 5px 0 rgba(2, 132, 199, 0.3) inset,
              0 20px 30px 0 rgba(0, 93, 255, 0.2) inset;
          }
          100% {
            transform: rotate(360deg);
            box-shadow:
              0 4px 10px 0 rgba(56, 189, 248, 0.4) inset,
              0 8px 15px 0 rgba(0, 93, 255, 0.3) inset,
              0 20px 30px 0 rgba(30, 64, 175, 0.2) inset;
          }
        }

        @keyframes loaderLetter {
          0%,
          100% {
            opacity: 0.2;
            transform: translateY(0) scale(1);
            filter: blur(1px);
          }
          50% {
            opacity: 1;
            transform: translateY(-2px) scale(1.1);
            filter: blur(0px);
          }
        }

        .animate-loaderCircle {
          animation: loaderCircle 4s linear infinite;
        }

        .animate-loaderLetter {
          animation: loaderLetter 2s infinite;
        }
      `}</style>
    </div>
  );
};
