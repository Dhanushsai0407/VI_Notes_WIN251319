import { useState, useRef, useEffect } from 'react';
import type { SessionTracker } from '../core/SessionTracker';
import { Play, Square } from 'lucide-react';

interface EditorProps {
    tracker: SessionTracker;
    onSessionStateChange: (isRecording: boolean) => void;
    onSaveSession?: (text: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ tracker, onSessionStateChange, onSaveSession }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        onSessionStateChange(isRecording);
    }, [isRecording, onSessionStateChange]);

    const handleStart = () => {
        tracker.startSession();
        setIsRecording(true);
        if (textareaRef.current) textareaRef.current.focus();
    };

    const handleStop = () => {
        setIsRecording(false);
        if (text.length > 0 && onSaveSession) {
            onSaveSession(text);
        }
    };

    const handleReset = () => {
        tracker.clear();
        setText('');
        setIsRecording(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!isRecording) {
            tracker.startSession();
            setIsRecording(true);
        }
        if (e.ctrlKey || e.metaKey) return;
        tracker.handleKeyDown(e.key, false);
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!isRecording) return;
        tracker.handleKeyUp(e.key);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        if (!isRecording) {
            tracker.startSession();
            setIsRecording(true);
        }
        const pastedText = e.clipboardData.getData('text');
        if (pastedText.length > 0) {
            tracker.recordPaste(pastedText.length);
        }
    };

    return (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2>Write</h2>
                    <p>Type normally. The session tracker will analyze your behavior in real-time.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {isRecording && (
                        <div className="status-badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                            <span style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: 'var(--accent)',
                                marginRight: '6px',
                                animation: 'pulse 2s infinite'
                            }}></span>
                            Recording
                        </div>
                    )}
                    {!isRecording && text.length > 0 && (
                        <div className="status-badge">Ready</div>
                    )}

                    {!isRecording ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-primary" onClick={handleStart}>
                                <Play size={16} /> Start Session
                            </button>
                            {text.length > 0 && onSaveSession && (
                                <button className="btn" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }} onClick={() => onSaveSession(text)}>
                                    Save Final Log
                                </button>
                            )}
                        </div>
                    ) : (
                        <button className="btn" style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={handleStop}>
                            <Square size={16} /> Stop Recording
                        </button>
                    )}

                    <button className="btn" onClick={handleReset} title="Reset Editor" style={{ padding: '10px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                    </button>
                </div>
            </div>

            <textarea
                ref={textareaRef}
                className="editor-textarea"
                placeholder="Just start typing to automatically begin a session..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onPaste={handlePaste}
            />
        </div>
    );
};
