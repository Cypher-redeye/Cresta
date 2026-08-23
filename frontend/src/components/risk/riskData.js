import { Shield, Target, Flame } from 'lucide-react';

/**
 * Central data store for the Risk Assessment quiz.
 * Uses translation keys (resolved via t() in components).
 */

export const questions = [
    {
        questionKey: 'rq1_question',
        descriptionKey: 'rq1_description',
        options: [
            { labelKey: 'rq1_o1', score: 1 },
            { labelKey: 'rq1_o2', score: 2 },
            { labelKey: 'rq1_o3', score: 3 },
            { labelKey: 'rq1_o4', score: 4 },
        ],
    },
    {
        questionKey: 'rq2_question',
        descriptionKey: 'rq2_description',
        options: [
            { labelKey: 'rq2_o1', score: 1 },
            { labelKey: 'rq2_o2', score: 2 },
            { labelKey: 'rq2_o3', score: 3 },
            { labelKey: 'rq2_o4', score: 4 },
        ],
    },
    {
        questionKey: 'rq3_question',
        descriptionKey: 'rq3_description',
        options: [
            { labelKey: 'rq3_o1', score: 1 },
            { labelKey: 'rq3_o2', score: 2 },
            { labelKey: 'rq3_o3', score: 3 },
            { labelKey: 'rq3_o4', score: 4 },
        ],
    },
    {
        questionKey: 'rq4_question',
        descriptionKey: 'rq4_description',
        options: [
            { labelKey: 'rq4_o1', score: 1 },
            { labelKey: 'rq4_o2', score: 2 },
            { labelKey: 'rq4_o3', score: 3 },
            { labelKey: 'rq4_o4', score: 4 },
        ],
    },
    {
        questionKey: 'rq5_question',
        descriptionKey: 'rq5_description',
        options: [
            { labelKey: 'rq5_o1', score: 1 },
            { labelKey: 'rq5_o2', score: 2 },
            { labelKey: 'rq5_o3', score: 3 },
            { labelKey: 'rq5_o4', score: 4 },
        ],
    },
    {
        questionKey: 'rq6_question',
        descriptionKey: 'rq6_description',
        options: [
            { labelKey: 'rq6_o1', score: 1 },
            { labelKey: 'rq6_o2', score: 2 },
            { labelKey: 'rq6_o3', score: 3 },
            { labelKey: 'rq6_o4', score: 4 },
        ],
    },
    {
        questionKey: 'rq7_question',
        descriptionKey: 'rq7_description',
        options: [
            { labelKey: 'rq7_o1', score: 1 },
            { labelKey: 'rq7_o2', score: 2 },
            { labelKey: 'rq7_o3', score: 3 },
            { labelKey: 'rq7_o4', score: 4 },
        ],
    },
    {
        questionKey: 'rq8_question',
        descriptionKey: 'rq8_description',
        options: [
            { labelKey: 'rq8_o1', score: 1 },
            { labelKey: 'rq8_o2', score: 2 },
            { labelKey: 'rq8_o3', score: 3 },
            { labelKey: 'rq8_o4', score: 4 },
        ],
    },
];

export const profiles = {
    conservative: {
        name: 'Conservative',
        label: 'The Guardian',
        descriptionKey: 'profile_conservative_full',
        color: '#3B82F6',
        icon: Shield,
        allocation: [
            { name: 'Bonds', value: 50, color: '#3B82F6' },
            { name: 'Large Cap', value: 25, color: '#10B981' },
            { name: 'Gold', value: 15, color: '#F59E0B' },
            { name: 'Cash', value: 10, color: '#6B7280' },
        ],
    },
    balanced: {
        name: 'Balanced',
        label: 'The Strategist',
        descriptionKey: 'profile_balanced_full',
        color: '#10B981',
        icon: Target,
        allocation: [
            { name: 'Index Funds', value: 40, color: '#10B981' },
            { name: 'Large Cap', value: 25, color: '#3B82F6' },
            { name: 'Bonds', value: 20, color: '#F59E0B' },
            { name: 'Mid Cap', value: 15, color: '#8B5CF6' },
        ],
    },
    aggressive: {
        name: 'Aggressive',
        label: 'The Maverick',
        descriptionKey: 'profile_aggressive_full',
        color: '#EF4444',
        icon: Flame,
        allocation: [
            { name: 'Mid/Small Cap', value: 40, color: '#EF4444' },
            { name: 'Large Cap', value: 30, color: '#10B981' },
            { name: 'Sector Funds', value: 20, color: '#8B5CF6' },
            { name: 'Crypto/Alt', value: 10, color: '#F59E0B' },
        ],
    },
};
