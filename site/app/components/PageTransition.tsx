import React from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { useLocation } from 'react-router';

interface PageTransitionProps {
  children: React.ReactNode;
}

const pageVariants = {
  initial: (custom: { isBack: boolean }) => ({
    opacity: 0,
    x: custom.isBack ? -100 : 100,
    scale: 0.95,
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  exit: (custom: { isBack: boolean }) => ({
    opacity: 0,
    x: custom.isBack ? 100 : -100,
    scale: 0.95,
  }),
};

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [prevPath, setPrevPath] = React.useState(location.pathname);
  
  // Determine if we're going back based on path comparison
  const isBack = location.pathname === '/' && prevPath === '/search';
  
  React.useEffect(() => {
    setPrevPath(location.pathname);
  }, [location.pathname]);

  return (
    <LayoutGroup>
      <AnimatePresence mode="wait" custom={{ isBack }}>
        <motion.div
          key={location.pathname}
          custom={{ isBack }}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.3,
          }}
          style={{ position: 'relative' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </LayoutGroup>
  );
}