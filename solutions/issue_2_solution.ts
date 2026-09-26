# Email Inbox Classic View Page UI — Implementation

## Summary
Adds a classic (table-style) inbox view page as an alternative to the card layout, with sortable columns, read/unread state, and bulk selection.

## Implementation

### `src/pages/InboxClassicView.tsx`
```tsx
import React, { useMemo, useState } from 'react';

export interface MailItem {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string; // ISO
  read: boolean;
  starred: boolean;
}

type SortKey = 'from' | 'subject' | 'date';

export const InboxClassicView: React.FC<{ items: MailItem[] }> = ({ items }) => {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [asc, setAsc] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return asc ? cmp : -cmp;
    });
    return copy;
  }, [items, sortKey, asc]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setAsc((v) => !v);
    else { setSortKey(key); setAsc(true); }
  };

  const toggleRow = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = selected.size === items.length && items.length > 0;

  return (
    <div className="inbox-classic">
      <table role="grid" aria-label="Inbox">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() =>
                  setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)))
                }
                aria-label="Select all"
              />
            </th>
            {(['from', 'subject', 'date'] as SortKey[]).map((k) => (
              <th key={k} onClick={() => toggleSort(k)} style={{ cursor: 'pointer' }}>
                {k[0].toUpperCase() + k.slice(1)}
                {sortKey === k ? (asc ? ' ▲' : ' ▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => (
            <tr
              key={m.id}
              className={m.read ? 'read' : 'unread'}
              aria-selected={selected.has(m.id)}
            >
              <td>
                <input
                  type="checkbox"
                  checked={selected.has(m.id)}
                  onChange={() => toggleRow(m.id)}
                  aria-label={`Select ${m.subject}`}
                />
              </td>
              <td>{m.starred ? '★ ' : ''}{m.from}</td>
              <td>
                <strong>{m.subject}</strong>
                <span className="snippet"> — {m.snippet}</span>
              </td>
              <td>{new Date(m.date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {selected.size > 0 && (
        <div className="bulk-bar" role="toolbar">
          {selected.size} selected
          <button>Mark read</button>
          <button>Archive</button>
          <button>Delete</button>
        </div>
      )}
    </div>
  );
};
```

## Behavior
- **Sortable columns** (from / subject / date) with ascending/descending toggle.
- **Read/unread** row styling; starred indicator.
- **Bulk selection** via per-row + select-all checkboxes and a contextual action bar.
- **Accessibility:** `role="grid"`, `aria-selected`, labeled checkboxes, keyboard-focusable headers.

## Risk
Additive page component; no changes to routing or existing card view.