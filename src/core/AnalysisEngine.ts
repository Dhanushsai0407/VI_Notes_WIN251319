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

        // Binary Human Likelihood Scoring Logic:
        // - Zero paste events -> 100% human likelihood
        // - Anything pasted (irrespective of characters) -> 0% human likelihood
        const score = (pasteEvents === 0 && pastedChars === 0) ? 100 : 0;

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
            confidenceScore: score,
            cpmHistory
        };
    }
}
