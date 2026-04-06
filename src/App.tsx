import { useState, useEffect, useMemo } from 'react';
import { Editor } from './components/Editor';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { SessionTracker } from './core/SessionTracker';
import { AnalysisEngine } from './core/AnalysisEngine';
import type { AnalysisResult } from './core/AnalysisEngine';
import { Auth } from './components/Auth';
import { AuthService } from './core/AuthService';
import type { User } from './core/AuthService';
import { SessionHistory } from './components/SessionHistory';
import { SessionService } from './core/SessionService';
import { Edit3, Activity, ShieldCheck, LogOut, History } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(AuthService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'editor' | 'analysis' | 'history'>('editor');
  const [isRecording, setIsRecording] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(AnalysisEngine.analyze([]));
  
  // Keep a persistent tracker instance
  const tracker = useMemo(() => new SessionTracker(), []);

  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = setInterval(() => {
        setAnalysisResult(AnalysisEngine.analyze(tracker.getLog()));
      }, 1000) as unknown as number;
    } else {
        setAnalysisResult(AnalysisEngine.analyze(tracker.getLog()));
    }
    return () => clearInterval(interval);
  }, [isRecording, tracker, activeTab]);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="brand">
          <ShieldCheck className="brand-icon" size={28} />
          <span>Vi-Notes</span>
        </div>
        
        <div className="nav-links">
          <div 
            className={`nav-item ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            <Edit3 size={18} />
            <span>Editor</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            <Activity size={18} />
            <span>Analysis Dashboard</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            <span>Session History</span>
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {currentUser && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem' }}>
                        <div style={{ color: 'var(--text-muted)' }}>Logged in as</div>
                        <div style={{ color: 'var(--text-main)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{currentUser.email}</div>
                    </div>
                    <button className="btn" style={{ padding: '6px' }} onClick={() => { AuthService.logout(); setCurrentUser(null); }} title="Log out">
                        <LogOut size={16} />
                    </button>
                </div>
             )}
             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                 Confidential writing session active locally. Data is not transmitted.
             </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {!currentUser ? (
            <Auth onLogin={setCurrentUser} />
        ) : (
            <>
                <div style={{ display: activeTab === 'editor' ? 'block' : 'none', height: '100%' }}>
                  <Editor 
                      tracker={tracker} 
                      onSessionStateChange={setIsRecording} 
                      onSaveSession={(text) => {
                          SessionService.saveSession(currentUser.id, text, analysisResult);
                          setActiveTab('history');
                      }}
                  />
                </div>
                
                {activeTab === 'analysis' && (
                    <div style={{ height: '100%' }}>
                      <AnalysisDashboard result={analysisResult} isRecording={isRecording} />
                    </div>
                )}

                {activeTab === 'history' && currentUser && (
                    <div style={{ height: '100%' }}>
                      <SessionHistory userId={currentUser.id} />
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
}

export default App;
