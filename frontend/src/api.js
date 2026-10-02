const json = async (r) => {
  if (!r.ok) {
    let msg = `Request failed (${r.status})`;
    try { msg = (await r.json()).error || msg; } catch { /* keep default */ }
    throw new Error(msg);
  }
  return r.status === 204 ? null : r.json();
};
const send = (url, method, body) =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) }).then(json);

export const getMembers = () => fetch('/api/members').then(json);
export const getActivity = () => fetch('/api/activity').then(json);
export const setStatus = (id, status) => send(`/api/members/${id}/status`, 'PATCH', { status });
export const addMember = (m) => send('/api/members', 'POST', m);
export const removeMember = (id) => send(`/api/members/${id}`, 'DELETE');

export const subscribe = (handlers, onOpen, onError) => {
  const es = new EventSource('/api/events');
  es.onopen = onOpen;
  es.onerror = onError;
  Object.entries(handlers).forEach(([name, fn]) =>
    es.addEventListener(name, (e) => fn(JSON.parse(e.data))));
  return () => es.close();
};
