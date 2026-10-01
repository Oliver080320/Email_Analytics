const INTERNAL = 'Turtle Down Under';
const fields = ['city', 'region', 'country'];
const mailboxes = value => String(value || '').toLowerCase().match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/g) || [];
const internalMailbox = value => value.endsWith('@turtledownunder.com.au');

// Locations describe the conversation contact, not the sender of its latest reply.
export function correctLocationLabels(rows, messages) {
  const threads = new Map();
  for (const message of messages) {
    if (!threads.has(message.conversation)) threads.set(message.conversation, []);
    threads.get(message.conversation).push(message);
  }
  const internalThreads = new Set();
  for (const [id, thread] of threads) {
    const headersAreInternal = thread.every(m => [m.sender, m.recipient].every(value => {
      const addresses = mailboxes(value);
      return addresses.length > 0 && addresses.every(internalMailbox);
    }));
    const bodyHasExternalMailbox = thread.some(m =>
      mailboxes(JSON.stringify([m.main, m.quoted])).some(address => !internalMailbox(address)));
    if (headersAreInternal && !bodyHasExternalMailbox) internalThreads.add(id);
  }
  return rows.map(row => {
    if (!fields.some(field => row[field] === INTERNAL)) return row;
    const internalOnly = internalThreads.has(row.conversation) &&
      row.organizationBasis === 'Internal-only thread' && !row.organizationContact;
    const result = {...row};
    for (const field of fields) {
      if (row[field] !== INTERNAL || internalOnly) continue;
      const original = row['original' + field[0].toUpperCase() + field.slice(1)];
      result[field] = original && original !== INTERNAL ? original : 'Unknown';
    }
    result.locationDisplayNote = internalOnly
      ? 'Turtle Down Under labels an internal-only thread with no external contact identified; it is not a geographic address.'
      : 'Missing contact locations are Unknown. An internal sender or reply does not establish the external contact address.';
    return result;
  });
}
