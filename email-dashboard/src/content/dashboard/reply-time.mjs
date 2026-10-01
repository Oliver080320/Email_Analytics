const addresses = value => String(value || '').toLowerCase().match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/g) || [];
const automatic = row => row.autoReply || row.status === 'Automatic reply';
const stamp = row => Date.parse(row.timestamp.replace(' ', 'T') + 'Z');

// Pair before filtering so changing dates cannot manufacture or hide a reply.
// Each incoming email is one observation, even when one reply answers several.
export function averageReplyTime(allRows, messages, selectedRows) {
  const headers = new Map(messages.map(m => [m.id, m]));
  const groups = new Map();
  for (const row of allRows) {
    if (!groups.has(row.conversation)) groups.set(row.conversation, []);
    groups.get(row.conversation).push(row);
  }
  const selected = new Set(selectedRows.map(r => r.id));
  const pairs = [], source = new Map();
  let unanswered = 0;
  const unansweredRows = [];
  for (const thread of groups.values()) {
    thread.sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id));
    for (const incoming of thread) {
      if (!selected.has(incoming.id) || incoming.direction !== 'Received' || automatic(incoming)) continue;
      const sender = addresses(headers.get(incoming.id)?.sender || incoming.sender_email)[0];
      if (!sender || sender.endsWith('@turtledownunder.com.au') || !Number.isFinite(stamp(incoming))) continue;
      const reply = thread.find(r => r.direction === 'Sent' && !automatic(r) &&
        addresses(headers.get(r.id)?.sender || r.sender_email).some(address => address.endsWith('@turtledownunder.com.au')) &&
        stamp(r) >= stamp(incoming) && r.id !== incoming.id &&
        addresses(headers.get(r.id)?.recipient).includes(sender));
      if (!reply) { unanswered++; unansweredRows.push(incoming); continue; }
      const seconds = (stamp(reply) - stamp(incoming)) / 1000;
      pairs.push({conversation:incoming.conversation, incomingId:incoming.id, receivedAt:incoming.timestamp,
        replyId:reply.id, repliedAt:reply.timestamp, replySender:headers.get(reply.id)?.sender || reply.sender_email, sender, seconds});
      source.set(incoming.id, incoming); source.set(reply.id, reply);
    }
  }
  return {seconds:pairs.length ? pairs.reduce((sum, p) => sum + p.seconds, 0) / pairs.length : null,
    pairs, unanswered, unansweredRows, sourceRows:[...source.values()]};
}

export function formatReplyTime(seconds) {
  if (seconds === null) return 'N/A';
  if (seconds < 60) return '<1 min';
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
