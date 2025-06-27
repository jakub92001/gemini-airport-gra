import React from 'react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-lg w-full border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-sky-300">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl">&times;</button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default EventModal;
