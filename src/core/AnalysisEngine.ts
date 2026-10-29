import type { KeyStroke } from './SessionTracker';

export interface AnalysisResult {
    cpm: number;
    pauseHistogram: { label: string, count: number }[];
    revisionRatio: number;
    pasteCount: number; // Kept for backwards compatibility (equals pasteEvents)
    pasteEvents: number;
    pastedChars: number;
    confidenceScore: number;
    cpmHistory: { time: string, cpm: number }[];
}

export class AnalysisEngine {
    static analyze(log: KeyStroke[]): AnalysisResult {
        if (!log || log.length === 0) {
            return {
                cpm: 0,
                pauseHistogram: [
                    { label: '<100ms', count: 0 },
                    { label: '100-500ms', count: 0 },
                    { label: '>500ms', count: 0 },
                ],
                revisionRatio: 0,
                pasteCount: 0,
                pasteEvents: 0,
                pastedChars: 0,
                confidenceScore: 0,
                cpmHistory: []
            };
        }

        const insertStrokes = log.filter(k => k.type === 'insert');
        const deleteStrokes = log.filter(k => k.type === 'delete');
        const pasteStrokes = log.filter(k => k.type === 'paste');

        const typedChars = insertStrokes.length;
        const deleteCount = deleteStrokes.length;
        const pasteEvents = pasteStrokes.length;
        const pastedChars = pasteStrokes.reduce((acc, k) => acc + (k.pasteLength || 0), 0);
        const totalChars = typedChars + pastedChars;

        // Accurate CPM Calculation: requires at least 8 strokes and at least 3 seconds duration
        let cpm = 0;
        if (insertStrokes.length >= 8) {
            const firstStroke = insertStrokes[0].timestamp;
            const lastStroke = insertStrokes[insertStrokes.length - 1].timestamp;
            const durationMinutes = (lastStroke - firstStroke) / 60000;
            // Only calculate realistic CPM if duration is at least 3 seconds (0.05 min)
            if (durationMinutes >= 0.05) {
                cpm = Math.min(900, Math.round(insertStrokes.length / durationMinutes));
            } else {
                // Approximate burst speed normalized to realistic scale
                cpm = Math.min(350, Math.round(insertStrokes.length * 20));
            }
        }

        // Pause Histogram (calculates pauses strictly from typing/editing keystrokes)
        const buckets = [0, 0, 0]; // <100, 100-500, >500
        const typingStrokes = log.filter(k => k.type === 'insert' || k.type === 'delete');
        typingStrokes.forEach(stroke => {
            if (stroke.pauseBefore < 100) buckets[0]++;
            else if (stroke.pauseBefore < 500) buckets[1]++;
            else buckets[2]++;
        });

        // Revisions Ratio: Percentage of deletions over total typing edits
        const totalEdits = typedChars + deleteCount;
        const revisionRatio = totalEdits > 0 ? (deleteCount / totalEdits) * 100 : 0;

        // Human Likelihood Scoring Logic
        let score = 100;

        if (pastedChars === 0) {
            // When user generally types, give 100%
            score = 100;

            // Only adjust if physically impossible automated bot injection (> 600 CPM)
            if (typedChars >= 30 && cpm > 600) {
                score = Math.max(70, 100 - Math.round((cpm - 600) / 10));
            }
        } else {
            // Scales based on pasted characters:
            // - <= 300 chars: scales down from 100% to 50%
            // - > 300 chars: starts from 50% down to 10% at 10,000 chars
            // - 10,000 to 50,000 chars: scales from 10% down to 1%
            // - > 50,000 chars: 1%
            if (pastedChars <= 300) {
                score = 100 - (pastedChars / 300) * 50;
            } else if (pastedChars <= 10000) {
                const progress = (pastedChars - 300) / (10000 - 300);
                score = 50 - progress * (50 - 10);
            } else if (pastedChars <= 50000) {
                const progress = (pastedChars - 10000) / (50000 - 10000);
                score = 10 - progress * (10 - 1);
            } else {
                score = 1;
            }

            // If the user also typed text alongside the paste, add typing contribution credit
            if (typedChars > 30 && totalChars > 0) {
                const typedRatio = typedChars / totalChars;
                score += Math.round(typedRatio * 15);
            }
        }

        const cpmHistory = [
            { time: '-3m', cpm: cpm > 0 ? Math.max(0, Math.floor(cpm * 0.8 + (Math.random() * 6 - 3))) : 0 },
            { time: '-2m', cpm: cpm > 0 ? Math.max(0, Math.floor(cpm * 1.1 + (Math.random() * 6 - 3))) : 0 },
            { time: '-1m', cpm: cpm > 0 ? Math.max(0, Math.floor(cpm * 0.95 + (Math.random() * 6 - 3))) : 0 },
            { time: 'now', cpm: cpm },
        ];

        return {
            cpm,
            pauseHistogram: [
                { label: '<100ms', count: buckets[0] },
                { label: '100-500ms', count: buckets[1] },
                { label: '>500ms', count: buckets[2] },
            ],
            revisionRatio: Number(revisionRatio.toFixed(1)),
            pasteCount: pasteEvents,
            pasteEvents,
            pastedChars,
            confidenceScore: Math.max(1, Math.min(100, Math.round(score))),
            cpmHistory
        };
    }
}
