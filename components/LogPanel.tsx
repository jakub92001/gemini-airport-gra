
import React, { useRef, useEffect } from 'react';

interface LogPanelProps {
  log: string[];
}

const LogPanel: React.FC<LogPanelProps> = ({ log }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-sky-300">Dziennik Menedżera</h2>
      <div className="flex-grow overflow-y-auto pr-2 space-y-2 text-sm">
        {log.slice().reverse().map((entry, index) => (
          <p key={log.length - index -1} className="text-slate-300 leading-relaxed border-b border-slate-700/50 pb-1 mb-1">
            <span className="font-mono text-sky-400/80 mr-2">[{ (log.length - index -1).toString().padStart(3, '0')}]</span>
            {entry}
          </p>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default LogPanel;
