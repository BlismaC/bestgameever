// Shared client state (single object, imported everywhere)
export const S = {
  content: null, ws: null, joined: false, id: 0, acc: '', cfg: {}, size: 24000, gen: null, gameName: 'Realmforge', persistent: 'file',
  me: null, srv: null, interpDelay: 80, look: { s: 0, h: 0, c: 0, p: 0, st: 0 },
  players: new Map(), mobs: new Map(), projs: new Map(), drops: [],
  res: [], rtypes: [], resHit: new Map(), world: null, npcs: [],
  structs: new Map(), structHit: new Map(), ghost: null,
  inv: [], sel: 0, dayTime: 0.25, coins: 0,
  fx: [], swings: new Map(), tele: [], buffs: [], healCd: 0, healCdMax: 1, evt: null,
  room: { kind: 'main', you: null, guests: [], visits: [], canBuild: true, canChest: true },
  ghosts: [], nextShot: 0, zones: [],
  pals: null, season: null, plea: null, market: null, vamp: false, cutscene: null, dialogOpen: null, palAtk: null,
  equip: [0, 0, 0], ar: null, breath: 10, mount: 0, pal: 0, flying: 0, palPos: null, notices: [],
  dead: false, ping: 0, lb: [], tp: 0, cam: { x: 0, y: 0, scale: 1, init: false },
};
