
export const sortAnchorsByConnections = (anchors, connections) => {
  if (!connections || connections.length === 0) return anchors;

  const anchorMap = {};
  anchors.forEach((a) => (anchorMap[a.IDENTIFIER] = a));

  // 1. Connection Maps bauen
  const nextMap = {}; // Von -> Nach
  const isDestination = new Set(); // Welche IDs sind Ziele?

  connections.forEach((conn) => {
    nextMap[conn.FROM_ANCHOR] = conn.TO_ANCHOR;
    isDestination.add(conn.TO_ANCHOR);
  });

  // 2. Startpunkt finden
  // Wir suchen einen Anker, der existiert, aber KEIN Ziel ist (also der erste in der Kette)
  let startAnchor = anchors.find(
    (a) => !isDestination.has(a.IDENTIFIER) && (nextMap[a.IDENTIFIER] || connections.length > 0)
  );

  // Fallback: Wenn kein klarer Start da ist (z.B. Kreis), nimm den ersten
  let currentId = startAnchor ? startAnchor.IDENTIFIER : anchors[0]?.IDENTIFIER;

  // 3. Die Kette ablaufen
  const sortedList = [];
  const visitedIds = new Set();

  while (currentId && anchorMap[currentId] && !visitedIds.has(currentId)) {
    visitedIds.add(currentId);
    sortedList.push(anchorMap[currentId]);
    currentId = nextMap[currentId]; // Springe zum nächsten
  }

  // 4. Verwaiste Anker anhängen (damit nichts fehlt)
  anchors.forEach((a) => {
    if (!visitedIds.has(a.IDENTIFIER)) {
      sortedList.push(a);
    }
  });

  return sortedList;
};