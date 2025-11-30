import React from 'react';
import { ArenaRecord } from '../services/arenaRegistry';
import { Icons } from './Icons';

interface ArenaDirectoryProps {
  waiting: ArenaRecord[];
  active: ArenaRecord[];
  onJoin: (roomId: string) => void;
  onSpectate: (roomId: string) => void;
  firebaseReady: boolean;
}

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-500 border border-dashed border-white/10 rounded-2xl">
    <Icons.Signal size={32} className="mb-3" />
    <p className="text-sm uppercase tracking-[0.3em]">{label}</p>
  </div>
);

const ArenaCard: React.FC<{
  record: ArenaRecord;
  actionLabel: string;
  onAction: (roomId: string) => void;
  disabled?: boolean;
}> = ({ record, actionLabel, onAction, disabled }) => (
  <div className="p-5 bg-black/40 border border-white/10 rounded-2xl flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest">Host</p>
        <p className="text-lg font-bold text-white">{record.hostName}</p>
      </div>
      <span className={`text-[10px] font-mono px-3 py-1 rounded-full border ${record.status === 'waiting' ? 'border-[#14F195]/30 text-[#14F195]' : 'border-[#9945FF]/30 text-[#9945FF]'}`}>
        {record.status === 'waiting' ? 'Waiting' : 'Live'}
      </span>
    </div>
    <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
      <span>Players: {record.playerCount}/{record.capacity}</span>
      <span>Buy-in: {record.buyIn.toFixed(2)} SOL</span>
    </div>
    <button
      onClick={() => onAction(record.roomId)}
      disabled={disabled}
      className={`mt-2 w-full py-2 rounded-lg border border-white/20 text-sm font-bold uppercase tracking-widest transition ${disabled ? 'text-gray-600 border-white/10 cursor-not-allowed' : 'text-white hover:bg-white/10'}`}
    >
      {actionLabel}
    </button>
  </div>
);

const ArenaDirectory: React.FC<ArenaDirectoryProps> = ({ waiting, active, onJoin, onSpectate, firebaseReady }) => {
  if (!firebaseReady) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10 text-center text-gray-500 font-mono text-sm">
        Configure Firebase env vars to enable global arena discovery.
      </div>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-6 pb-20 space-y-10">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black uppercase tracking-tight text-white">Open Arenas</h2>
          <span className="text-xs text-gray-500 font-mono">{waiting.length} available</span>
        </div>
        {waiting.length === 0 ? (
          <EmptyState label="Awaiting Hosts" />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {waiting.map((record) => (
              <ArenaCard key={record.roomId} record={record} actionLabel="Join" onAction={onJoin} disabled={record.playerCount >= record.capacity} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black uppercase tracking-tight text-white">Running Games</h2>
          <span className="text-xs text-gray-500 font-mono">{active.length} live</span>
        </div>
        {active.length === 0 ? (
          <EmptyState label="No Live Streams" />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {active.map((record) => (
              <ArenaCard key={record.roomId} record={record} actionLabel="View" onAction={onSpectate} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ArenaDirectory;
