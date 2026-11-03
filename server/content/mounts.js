// Mounts. flying = ignores trees/rocks/water and cannot drown. speed multiplies your run speed. Use the item (F / right-click) to mount or dismount.
module.exports = {
  cloud_glider:  { name: 'Cloud Glider', flying: 1, speed: 1.35, color: '#e8f4ff', desc: 'A feathered glider. Soar over trees and lakes.', cost: { feather: 18, slime_gel: 30, leather: 12 }, station: 'workbench' },
  witch_broom:   { name: "Witch's Broom", flying: 1, speed: 1.55, color: '#8a5a30', desc: 'Swish! Rare find from bog witches. A Halloween classic.' },
  magic_carpet:  { name: 'Magic Carpet', flying: 1, speed: 1.5, color: '#c0262d', desc: 'Dropped by tomb guardians. Floats just above the dunes.' },
  wyrm_saddle:   { name: 'Wyrm Saddle', flying: 1, speed: 1.8, color: '#ff5a1a', desc: 'Saddle of the Magma Wyrm. Blazing fast.' },
  dire_wolf:     { name: 'Dire Wolf Mount', flying: 0, speed: 1.5, color: '#3a3a44', desc: 'Tamed dire wolf. Fast on the ground.' },
};
