import { useState } from 'react';
import { sync } from '../sync';
import { createTournament } from '../useTournament';
import type { Tournament } from '../types';

interface Props {
  onOpenEvent: (id: string) => void;
  onExit: () => void;
}

function loadAllEvents(): Tournament[] {
  return sync
    .listEventIds()
    .map((id) => sync.load(id))
    .filter((t): t is Tournament => t != null);
}

export default function EventsList({ onOpenEvent, onExit }: Props) {
  const [events, setEvents] = useState<Tournament[]>(() => loadAllEvents());
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [courseName, setCourseName] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    const t = createTournament({
      name: name.trim(),
      courseName: courseName.trim() || 'Course',
    });
    sync.save(t);
    onOpenEvent(t.id);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this tournament?')) return;
    sync.remove(id);
    setEvents((list) => list.filter((e) => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 p-4 pb-8">
      <header className="flex items-center justify-between mb-6">
        <button onClick={onExit} className="text-sm text-neutral-400">
          ← Home
        </button>
        <h1 className="font-bold">Tournaments</h1>
        <div className="w-10" />
      </header>

      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg mb-6"
        >
          + New tournament
        </button>
      ) : (
        <div className="bg-neutral-900 rounded-lg p-4 mb-6 space-y-3">
          <h2 className="font-semibold">New tournament</h2>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Event name"
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2"
          />
          <input
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Course name"
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setCreating(false);
                setName('');
                setCourseName('');
              }}
              className="flex-1 py-2 bg-neutral-800 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="flex-1 py-2 bg-emerald-600 rounded text-sm font-semibold disabled:opacity-40"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <p className="text-sm text-neutral-500 text-center mt-8">
          No tournaments yet. Create one above.
        </p>
      ) : (
        <div className="space-y-2">
          {events.map((e) => {
            const players = Object.keys(e.players).length;
            return (
              <div key={e.id} className="bg-neutral-900 rounded-lg p-3 flex items-center justify-between">
                <button onClick={() => onOpenEvent(e.id)} className="flex-1 text-left">
                  <div className="font-semibold">{e.name}</div>
                  <div className="text-xs text-neutral-500">
                    {e.courseName} · {e.date} · {players} players · {e.groups.length} groups
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-red-400 text-xs px-2 py-1"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
