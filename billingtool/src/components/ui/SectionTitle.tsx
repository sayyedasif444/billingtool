'use client';

import { motion } from 'framer-motion';

interface SectionTitleProps {
  children: React.ReactNode;
  align?: "center" | "left";
}

export default function SectionTitle({ children, align = "center" }: SectionTitleProps) {
  const alignClass = align === "center" ? "text-center" : "text-left";
  
  return (
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7 }}
      className={`text-3xl md:text-4xl font-bold text-white ${alignClass}`}
    >
      {children}
    </motion.h2>
  );
} 