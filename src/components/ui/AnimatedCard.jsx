import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function AnimatedCard({ children, className = "", delay = 0, persistentMobileContent }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const isItemsStart = className.includes('!items-start') || className.includes('items-start');
  const gapClass = className.includes('gap-1.5') ? 'gap-1.5' : 'gap-2.5';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20, transition: { delay: 0 } }}
      transition={{ duration: 0.25, ease: 'easeOut', delay }}
      className={`fixed bottom-0 left-0 w-full md:w-auto md:min-w-[300px] md:max-w-sm md:absolute md:bottom-auto md:top-24 md:left-8 z-20 flex flex-col bg-white border-t-2 md:border-2 border-black shadow-[0_-6px_0_#000] md:shadow-[6px_6px_0_#000] rounded-t-3xl md:rounded-none ${className.replace('!items-start', '').replace('gap-1.5', '')}`}
    >

      <div
        className="w-full flex justify-center items-center h-[36px] md:hidden cursor-pointer relative z-10 shrink-0 border-b-2 border-black/10 bg-white/20 backdrop-blur-sm"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="w-6 h-6 text-black pointer-events-none" />
        ) : (
          <ChevronUp className="w-6 h-6 text-black pointer-events-none" />
        )}
      </div>

      {/* Expandable Content */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`w-full relative z-10 ${isExpanded ? 'pointer-events-auto' : 'pointer-events-none md:pointer-events-auto'}`}
      >
        <div className={`w-full flex flex-col ${isItemsStart ? 'items-start' : 'items-center'} ${gapClass} px-5 pb-5 pt-1 md:p-10 md:pt-10`}>
          {children}
        </div>
      </motion.div>

      {persistentMobileContent && (
        <div className="w-full md:hidden px-5 pt-1 pb-3 shrink-0 relative z-10 bg-white/40 backdrop-blur-sm">
          {persistentMobileContent}
        </div>
      )}
    </motion.div>
  )
}
