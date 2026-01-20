import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface DangerZoneProps {
  onDelete: () => void;
}

export function DangerZone({ onDelete }: DangerZoneProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [verificationText, setVerificationText] = useState('');

  // Reset state when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setStep(1);
      setVerificationText('');
    } else {
        // Lock body scroll
        document.body.style.overflow = 'hidden';
    }
    return () => {
        document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const handleConfirmStep1 = () => setStep(2);
  const handleConfirmStep2 = () => setStep(3);

  const handleFinalDelete = () => {
    if (verificationText === 'BORRAR') {
      onDelete();
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-12 mt-8 border-t border-white/5">

      {/* Initial Ghost Trigger */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="px-6 py-3 rounded-lg border border-white/5 text-muted hover:text-white hover:border-white/10 text-xs font-bold uppercase tracking-widest transition-all opacity-50 hover:opacity-100"
        >
          Zona de Perill
        </button>
      ) : (
        <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-red-900/10"
        >
            Esborrar totes les dades
        </motion.button>
      )}

      {/* Security Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
             {/* Backdrop */}
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
                onClick={() => setIsModalOpen(false)}
             />

             {/* Modal Content */}
             <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`
                    relative w-full max-w-lg rounded-t-2xl shadow-2xl p-6 pointer-events-auto transition-colors duration-500 border-t
                    ${step === 2 || step === 3 ? 'bg-red-950/90 border-red-500/30' : 'bg-surface border-white/10'}
                `}
             >
                {/* Close Handle */}
                <div
                    className="w-full flex items-center justify-center py-2 -mt-4 mb-4 cursor-pointer"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div className="w-12 h-1 bg-white/10 rounded-full" />
                </div>

                <div className="space-y-6 pb-6">
                    {/* Step 1: Confirmation */}
                    {step === 1 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <h3 className="text-xl font-bold text-white">Estàs segur?</h3>
                            <p className="text-muted text-sm leading-relaxed">
                                Aquesta acció és irreversible y perdràs tot el teu historial.
                            </p>
                            <button
                                onClick={handleConfirmStep1}
                                className="w-full py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold uppercase tracking-wide transition-all"
                            >
                                Continuar
                            </button>
                        </motion.div>
                    )}

                    {/* Step 2: Critical Warning */}
                    {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-4 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-2 text-3xl">
                                ⚠️
                            </div>
                            <h3 className="text-xl font-bold text-red-100">Advertencia Crítica</h3>
                            <p className="text-red-200/70 text-sm leading-relaxed">
                                Es borraran definitivament tots els teus exercicis i registres de la base de dades local.
                            </p>
                            <button
                                onClick={handleConfirmStep2}
                                className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wide transition-all shadow-lg shadow-red-900/30"
                            >
                                Entesos, vull borrar
                            </button>
                        </motion.div>
                    )}

                    {/* Step 3: Code Validation */}
                    {step === 3 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <h3 className="text-xl font-bold text-red-100">Confirmació Final</h3>
                            <p className="text-red-200/70 text-sm">
                                Escriu <span className="font-mono font-bold text-white bg-black/30 px-1 rounded">BORRAR</span> a continuació:
                            </p>

                            <input
                                type="text"
                                value={verificationText}
                                onChange={(e) => setVerificationText(e.target.value)}
                                placeholder="BORRAR"
                                className="w-full bg-black/40 border border-red-500/30 rounded-xl p-4 text-center text-xl font-bold text-white placeholder-white/10 focus:outline-none focus:border-red-500 transition-colors"
                                autoFocus
                            />

                            <button
                                onClick={handleFinalDelete}
                                disabled={verificationText !== 'BORRAR'}
                                className={`
                                    w-full py-4 rounded-xl font-bold uppercase tracking-wide transition-all
                                    ${verificationText === 'BORRAR'
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-900/40 hover:scale-[1.02]'
                                        : 'bg-white/5 text-white/20 cursor-not-allowed'}
                                `}
                            >
                                Borrar Definitivament
                            </button>
                        </motion.div>
                    )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
