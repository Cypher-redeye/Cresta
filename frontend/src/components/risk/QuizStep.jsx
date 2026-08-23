import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

/**
 * Renders a single quiz question with animated option cards.
 * Resolves translation keys from riskData via t().
 */
const QuizStep = ({ question, step, answers, onOptionSelect }) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-6 ml-12">
            <div>
                <h2 className="text-2xl font-bold text-notion-text">
                    {t(question.questionKey)}
                </h2>
                <p className="text-notion-muted mt-1 text-lg">
                    {t(question.descriptionKey)}
                </p>
            </div>
            <div className="space-y-3">
                {question.options.map((option, idx) => (
                    <motion.button
                        key={idx}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onOptionSelect(option.score)}
                        className={`w-full text-left py-5 px-8 rounded-2xl border font-semibold transition-all text-lg apple-glass
                            ${answers[step] === option.score
                                ? 'border-notion-emerald bg-notion-emerald-bg text-notion-emerald shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                : 'border-notion-border text-notion-muted hover:border-notion-emerald/50 hover:text-notion-text'}`}
                    >
                        {t(option.labelKey)}
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default QuizStep;
