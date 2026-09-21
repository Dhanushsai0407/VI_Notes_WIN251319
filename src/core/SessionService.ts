import axios from 'axios';
import type { AnalysisResult } from './AnalysisEngine';

export interface SavedSession {
    id: string;
    userId: string;
    date: number;
    text: string;
    analysis: AnalysisResult;
}

const API_URL = 'https://vinotes-backend-k1n3.onrender.com';

export class SessionService {

    static async getSessions(userId: string): Promise<SavedSession[]> {
        const response = await axios.get(
            `${API_URL}/api/sessions/${userId}`
        );

        return response.data.map((session: any) => ({
            id: session._id,
            userId: session.userId,
            date: new Date(session.createdAt).getTime(),
            text: session.text,
            analysis: session.analysis
        }));
    }

    static async saveSession(
        userId: string,
        text: string,
        analysis: AnalysisResult
    ): Promise<SavedSession> {

        const response = await axios.post(
            `${API_URL}/api/sessions`,
            {
                userId,
                text,
                analysis
            }
        );

        const session = response.data;

        return {
            id: session._id,
            userId: session.userId,
            date: new Date(session.createdAt).getTime(),
            text: session.text,
            analysis: session.analysis
        };
    }
}