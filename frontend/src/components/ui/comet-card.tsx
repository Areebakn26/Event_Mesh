import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface CometCardProps {
  children: React.ReactNode;
  className?: string;
  rotateDepth?: number;
  translateDepth?: number;
}

export const CometCard: React.FC<CometCardProps> = ({
  children,
  className = "",
  rotateDepth = 17.5,
  translateDepth = 20,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [rotateDepth, -rotateDepth]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-rotateDepth, rotateDepth]);

  const translateX = useTransform(mouseXSpring, [-0.5, 0.5], [-translateDepth, translateDepth]);
  const translateY = useTransform(mouseYSpring, [-0.5, 0.5], [-translateDepth, translateDepth]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div style={{ perspective: "1000px" }} className="w-full h-full">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          translateX,
          translateY,
          transformStyle: "preserve-3d",
        }}
        className={`relative transition-all duration-200 ease-out h-full w-full ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default CometCard;
