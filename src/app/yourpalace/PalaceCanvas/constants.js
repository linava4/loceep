export const ItemTypes = { ROOM: "room", OBJECT: "object", ANCHOR: "anchor" };
export const GRID_SIZE = 100;

// Später aus der DB laden
export const SIDEBAR_ITEMS = [
  {
    section: "Räume",
    items: [
      { type: ItemTypes.ROOM, icon: "🏠", width: GRID_SIZE, height: GRID_SIZE, variant: 1 },
      { type: ItemTypes.ROOM, icon: "🏛️", width: GRID_SIZE * 2, height: GRID_SIZE, variant: 2 },
      { type: ItemTypes.ROOM, icon: "🏢", width: GRID_SIZE * 2, height: GRID_SIZE * 2, variant: 3 },
    ],
  },
  {
    section: "Objekte",
    items: [
      { type: ItemTypes.OBJECT, icon: "🛋️" },
      { type: ItemTypes.OBJECT, icon: "🪑" },
    ],
  },
  {
    section: "Anker",
    items: [
      { type: ItemTypes.ANCHOR, icon: "🖼️" },
      { type: ItemTypes.ANCHOR, icon: "🔗" },
    ],
  },
];
