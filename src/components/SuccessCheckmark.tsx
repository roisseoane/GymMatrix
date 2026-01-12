import { motion } from 'framer-motion';

export function SuccessCheckmark() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="100"
        height="100"
        viewBox="0 0 100 100"
        fill="none"
        stroke="#22c55e" // green-500
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M20 50 L40 70 L80 30"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </motion.svg>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="text-2xl font-bold text-green-500 mt-4"
      >
        Workout Logged!
      </motion.h3>
    </div>
  );
}
