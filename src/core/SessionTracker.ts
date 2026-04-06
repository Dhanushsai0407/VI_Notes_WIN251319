export interface KeyStroke {
  type: 'insert' | 'delete' | 'navigation' | 'paste' | 'other';
  timestamp: number;
  pauseBefore: number;
  duration: number; // Difference between keydown and keyup
  pasteLength?: number; // Only exists on 'paste' events
}

export class SessionTracker {
  private keystrokes: KeyStroke[] = [];
  private lastKeyUpTime: number = 0;
  private sessionStartTime: number = 0;
  private activeKeys: Map<string, { timestamp: number, type: KeyStroke['type'] }> = new Map();

  startSession() {
    this.keystrokes = [];
    this.sessionStartTime = Date.now();
    this.lastKeyUpTime = this.sessionStartTime;
    this.activeKeys.clear();
  }

  handleKeyDown(key: string, isPaste: boolean = false) {
    if (!this.sessionStartTime) return;
    if (this.activeKeys.has(key) && !isPaste) return; // Prevent auto-repeat triggers

    const now = Date.now();
    const pauseBefore = this.lastKeyUpTime ? now - this.lastKeyUpTime : 0;
    
    let type: KeyStroke['type'] = 'insert';
    if (isPaste) {
      type = 'paste';
    } else if (key === 'Backspace' || key === 'Delete') {
      type = 'delete';
    } else if (key.startsWith('Arrow') || key === 'Home' || key === 'End') {
      type = 'navigation';
    } else if (key.length > 1 && key !== 'Enter' && key !== 'Space') {
      type = 'other';
    }

    if (isPaste) {
        this.keystrokes.push({ type, timestamp: now, pauseBefore, duration: 0 });
        this.lastKeyUpTime = now;
    } else {
        this.activeKeys.set(key, { timestamp: now, type });
    }
  }

  recordPaste(length: number) {
    if (!this.sessionStartTime) return;
    const now = Date.now();
    const pauseBefore = this.lastKeyUpTime ? now - this.lastKeyUpTime : 0;
    
    this.keystrokes.push({ 
        type: 'paste', 
        timestamp: now, 
        pauseBefore, 
        duration: 0,
        pasteLength: length
    });
    this.lastKeyUpTime = now;
  }

  handleKeyUp(key: string) {
    if (!this.sessionStartTime) return;
    
    const active = this.activeKeys.get(key);
    if (!active) return;
    
    const now = Date.now();
    const duration = now - active.timestamp;
    const pauseBefore = this.lastKeyUpTime ? active.timestamp - this.lastKeyUpTime : 0;
    
    this.keystrokes.push({
      type: active.type,
      timestamp: active.timestamp,
      pauseBefore,
      duration
    });

    this.activeKeys.delete(key);
    this.lastKeyUpTime = now;
  }

  getLog(): KeyStroke[] {
    return this.keystrokes;
  }

  clear() {
    this.keystrokes = [];
    this.sessionStartTime = 0;
    this.lastKeyUpTime = 0;
    this.activeKeys.clear();
  }
}
