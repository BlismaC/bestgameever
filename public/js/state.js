// Shared client state (single object, imported everywhere)
export const S = {
  content: null, ws: null, joined: false, id: 0, cfg: {}, size: 8000, gen: null, gameName: 'Realmforge',
  me: null, srv: null, interpDelay: 80,
  players: new Map(), mobs: new Map(), projs: new Map(), drops: [],
  res: [], rtypes: [], resHit: new Map(), world: null,
  structs: new Map(), structHit: new Map(), ghost: null,
  inv: [], sel: 0, dayTime: 0.25,
  fx: [], swings: new Map(),
  dead: false, ping: 0, lb: [],
  cam: { x: 0, y: 0, scale: 1, init: false },
};
