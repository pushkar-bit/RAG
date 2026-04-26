"use client";

import { motion } from "framer-motion";

export function AnimatedSVGBackground() {
  return (
    <div className="fixed inset-0 -z-50 h-full w-full bg-background overflow-hidden pointer-events-none">
      <motion.svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute h-full w-full opacity-[0.03] dark:opacity-[0.05]"
      >
        <motion.path
          d="M-20,50 C20,30 80,70 120,50 L120,120 L-20,120 Z"
          fill="currentColor"
          initial={{ y: 100 }}
          animate={{ y: [0, -5, 0] }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.path
          d="M-20,70 C30,45 70,85 120,60 L120,120 L-20,120 Z"
          fill="currentColor"
          initial={{ y: 100 }}
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </motion.svg>
    </div>
  );
}
