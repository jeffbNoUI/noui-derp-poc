import { useState, useEffect, useRef, useCallback } from 'react';

interface Command {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  commands: Command[];
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ commands, isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const executeSelected = useCallback(() => {
    if (filtered[selectedIdx]) {
      filtered[selectedIdx].action();
      onClose();
    }
  }, [filtered, selectedIdx, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((p) => Math.min(p + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((p) => Math.max(p - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeSelected();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, filtered.length, selectedIdx, onClose, executeSelected]);

  if (!isOpen) return null;

  // Group by category
  const categories = [...new Set(filtered.map((c) => c.category))];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 iw-cmd-backdrop" onClick={onClose} />

      {/* Palette */}
      <div className="relative w-full max-w-lg iw-cmd-palette overflow-hidden iw-scale-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-iw-borderLight">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-iw-navy to-iw-navyLight flex items-center justify-center text-white font-bold text-[10px] font-display flex-shrink-0">N</div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What would you like to do?"
            className="flex-1 text-sm outline-none bg-transparent text-iw-text placeholder:text-iw-textTertiary font-body"
          />
          <kbd className="text-[10px] text-iw-textTertiary bg-iw-page px-1.5 py-0.5 rounded-md border border-iw-borderLight font-mono">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-iw-textTertiary">
              No commands match &ldquo;{query}&rdquo;
            </div>
          )}

          {categories.map((cat) => {
            const catCommands = filtered.filter((c) => c.category === cat);
            return (
              <div key={cat}>
                <div className="px-5 py-1.5 text-[10px] text-iw-textTertiary uppercase tracking-wider font-semibold">
                  {cat}
                </div>
                {catCommands.map((cmd) => {
                  const globalIdx = filtered.indexOf(cmd);
                  const isSelected = globalIdx === selectedIdx;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIdx(globalIdx)}
                      className={`w-full flex items-center justify-between px-5 py-2.5 text-left transition-all ${
                        isSelected
                          ? 'bg-iw-sageLight/60 text-iw-sage'
                          : 'text-iw-text hover:bg-iw-page'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{cmd.icon}</span>
                        <span className="text-sm font-medium">{cmd.label}</span>
                      </div>
                      {cmd.shortcut && (
                        <kbd className="text-[10px] text-iw-textTertiary bg-iw-page px-1.5 py-0.5 rounded-md border border-iw-borderLight font-mono">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-iw-borderLight px-5 py-2.5 flex items-center justify-between text-[10px] text-iw-textTertiary">
          <span>&#8593;&#8595; navigate &middot; &#8629; select &middot; esc close</span>
          <span>{filtered.length} command{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}
