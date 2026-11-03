// "Pals": small creatures that follow you and AUTO-MINE nearby ore and rock into your inventory.
// You find them rarely: while mining the matching ore, or as a very rare monster drop. Use the item to call / dismiss the pal.
// tier = highest ore tier it can mine, every = seconds between swings, power = damage to the node per swing.
module.exports = {
  rocklet:  { name: 'Rocklet',  color: '#8a8f98', tier: 0, every: 7.5, power: 22, mines: ['rock'], desc: 'A shy pebble-creature. Mines boulders.' },
  cuprit:   { name: 'Cuprit',   color: '#d8843a', tier: 1, every: 7,   power: 26, mines: ['rock', 'ore'], desc: 'Loves copper. Digs ore up to tier 1.' },
  ferrox:   { name: 'Ferrox',   color: '#b7bcc4', tier: 2, every: 6.5, power: 32, mines: ['rock', 'ore'], desc: 'Iron-hearted digger.' },
  glimmer:  { name: 'Glimmer',  color: '#ffd23f', tier: 3, every: 6.5, power: 38, mines: ['rock', 'ore'], desc: 'Sniffs out gold and cobalt.' },
  emberpup: { name: 'Emberpup', color: '#ff6a2a', tier: 4, every: 6,   power: 46, mines: ['rock', 'ore'], desc: 'Burrows through hellstone and obsidian.' },
  frostling:{ name: 'Frostling',color: '#9be7ff', tier: 4, every: 6,   power: 44, mines: ['rock', 'ore'], desc: 'Chills ice and sapphire loose.' },
  jadeling: { name: 'Jadeling', color: '#38b36f', tier: 4, every: 6,   power: 44, mines: ['rock', 'ore'], desc: 'Gem-hungry. Great in the jungle.' },
  voidmote: { name: 'Voidmote', color: '#9a4aff', tier: 6, every: 5.5, power: 62, mines: ['rock', 'ore'], desc: 'A hole in space that eats ore.' },
};
