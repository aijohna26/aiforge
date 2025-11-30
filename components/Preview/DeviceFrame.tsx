"use client";

import { ReactNode } from "react";

interface DeviceFrameProps {
  children: ReactNode;
  type?: "ios" | "android";
  width?: number;
  height?: number;
}

export function DeviceFrame({ children, type = "ios", width = 375, height = 812 }: DeviceFrameProps) {
  return (
    <div className="relative mx-auto transition-all duration-300 ease-in-out" style={{ width: `${width}px`, height: `${height}px` }}>
      {/* Device outer shell */}
      <div className="relative h-full w-full rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-900 p-3 shadow-2xl">
        {/* Notch (iOS style) */}
        {type === "ios" && (
          <div className="absolute left-1/2 top-3 z-10 h-6 w-32 -translate-x-1/2 rounded-full bg-black" />
        )}

        {/* Screen */}
        <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] bg-white">
          {/* Status bar */}
          <div className="absolute left-0 right-0 top-0 z-10 flex h-12 items-center justify-between bg-black/5 px-6 text-xs">
            <span className="font-semibold">9:41</span>
            <div className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <svg className="h-3 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" />
              </svg>
              <div className="h-2 w-6 rounded-sm bg-black">
                <div className="h-full w-3/4 rounded-sm bg-current" />
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="h-full w-full overflow-auto pt-12 pb-8">
            {children}
          </div>

          {/* Home indicator (iOS style) */}
          {type === "ios" && (
            <div className="absolute bottom-2 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-black/20" />
          )}
        </div>

        {/* Side buttons */}
        <div className="absolute -left-1 top-24 h-12 w-1 rounded-l-full bg-slate-700" />
        <div className="absolute -left-1 top-40 h-16 w-1 rounded-l-full bg-slate-700" />
        <div className="absolute -left-1 top-60 h-16 w-1 rounded-l-full bg-slate-700" />
        <div className="absolute -right-1 top-32 h-20 w-1 rounded-r-full bg-slate-700" />
      </div>
    </div>
  );
}
