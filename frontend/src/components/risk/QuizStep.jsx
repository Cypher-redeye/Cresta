import React from 'react';
import { Info, Check } from 'lucide-react';

/**
 * Renders a single quiz question with selectable option buttons.
 */
const QuizStep = ({ question, step, answers, onOptionSelect }) => {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-600/10 text-cyan-600 flex items-center justify-center text-sm shrink-0 mt-1">
                        {step + 1}
                    </span>
                    {question.question}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 ml-12 text-sm italic italic flex items-center gap-2">
                    <Info className="w-3 h-3" /> {question.description}
                </p>
            </div>

            <div className="grid gap-4 ml-12">
                {question.options.map((option, idx) => (
                    <button
                        key={idx}
                        onClick={() => onOptionSelect(option.score)}
                        className={`group p-5 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden
                            ${answers[step] === option.score
                                ? 'border-cyan-500 bg-cyan-500/5 dark:bg-cyan-500/10'
                                : 'border-gray-200 dark:border-white/5 hover:border-cyan-500/40 bg-white/50 dark:bg-fintech-card/30'}`}
                    >
                        <div className="flex justify-between items-center relative z-10">
                            <span className={`font-semibold text-lg ${answers[step] === option.score ? 'text-cyan-600 dark:text-neon-cyan' : 'text-gray-700 dark:text-gray-300'}`}>
                                {option.text}
                            </span>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                ${answers[step] === option.score ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-gray-300 dark:border-white/10'}`}>
                                {answers[step] === option.score && <Check className="w-4 h-4" />}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuizStep;
