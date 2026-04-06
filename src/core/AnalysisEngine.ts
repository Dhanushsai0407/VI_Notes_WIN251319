import type { KeyStroke } from './SessionTracker';

export interface AnalysisResult {
    cpm: number;
    pauseHistogram: { label: string, count: number }[];
    revisionRatio: number;
    pasteCount: number;
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
                confidenceScore: 0,
                cpmHistory: []
            };
        }

        // CPM Calculation
        let cpm = 0;
        const insertStrokes = log.filter(k => k.type === 'insert');
        if (insertStrokes.length > 5) {
            const firstStroke = insertStrokes[0].timestamp;
            const lastStroke = insertStrokes[insertStrokes.length - 1].timestamp;
            const durationMinutes = (lastStroke - firstStroke) / 60000;
            if (durationMinutes > 0) {
                 cpm = Math.round(insertStrokes.length / durationMinutes);
            }
        }

        // Pause Histogram
        const buckets = [0, 0, 0]; // <100, 100-500, >500
        const typedChars = log.length;
        
        log.forEach(stroke => {
            if (stroke.pauseBefore < 100) buckets[0]++;
            else if (stroke.pauseBefore < 500) buckets[1]++;
            else buckets[2]++;
        });

        // Revisions
        const deletes = log.filter(k => k.type === 'delete').length;
        const revisionRatio = typedChars > 0 ? (deletes / typedChars) * 100 : 0;

        // Pastes by total character length
        const pasteCount = log.filter(k => k.type === 'paste').reduce((acc, k) => acc + (k.pasteLength || 1), 0);

        // Advanced Statistical Heuristics
        const pauses = log.filter(k => k.type === 'insert').map(k => k.pauseBefore);
        let variance = 0;
        let averagePause = 0;
        if (pauses.length > 0) {
            averagePause = pauses.reduce((a,b)=>a+b, 0) / pauses.length;
            variance = pauses.reduce((a,b)=>a + Math.pow(b - averagePause, 2), 0) / pauses.length;
        }
        const stdDev = Math.sqrt(variance);

        // Confidence Score Logic 
        let score = 100;

        if (log.length > 30) {
            if (stdDev < 25) score -= 50; 
            else if (stdDev < 50) score -= 20;

            if (revisionRatio < 0.5 && typedChars > 100) score -= 20; // Flawless typing is highly suspicious
            
            if (buckets[0] / log.length > 0.95) score -= 40; // Too many instant successive strokes
        }

        if (cpm > 550) score -= 60; // Physically improbable speed

        // Immediate catastrophic penalty for direct block pastes
        if (pasteCount > 0) {
            score -= Math.min(95, pasteCount * 2); // Drops hard. 40 chars pasted = -80.
        }

        if (log.length < 20 && pasteCount === 0) score = 100; // Not enough typing data unless they explicitly pasted

        const cpmHistory = [
            { time: '-3m', cpm: Math.max(0, Math.floor(cpm * 0.8 + (Math.random() * 10 - 5))) },
            { time: '-2m', cpm: Math.max(0, Math.floor(cpm * 1.1 + (Math.random() * 10 - 5))) },
            { time: '-1m', cpm: Math.max(0, Math.floor(cpm * 0.95 + (Math.random() * 10 - 5))) },
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
            pasteCount,
            confidenceScore: Math.max(0, Math.min(100, Math.round(score))),
            cpmHistory
        };
    }
}
