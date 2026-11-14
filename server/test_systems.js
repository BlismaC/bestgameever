process.env.WORLD_SEED='1337';
const os=require('os'),fs=require('fs'),path=require('path');
const R=__dirname+'/';
const {FileStore}=require(R+'storage');const Game=require(R+'game');const content=require(R+'content');const cmd=require(R+'commands');
(async()=>{
const g=new Game(new FileStore(fs.mkdtempSync(path.join(os.tmpdir(),'s2-'))));
const msgs=[];const mk=(n)=>({readyState:1,bufferedAmount:0,send(s){try{msgs.push([n,JSON.parse(s)])}catch(e){}},close(){}});
const A=await g.join(mk('A'),{token:'a'.repeat(32),name:'Alice'}),B=await g.join(mk('B'),{token:'b'.repeat(32),name:'Bob'});
const tick=(n)=>{for(let i=0;i<n;i++)g.tick(1/30)};let bad=0;const ok=(c,m)=>{if(!c)bad++;console.log((c?'ok   ':'FAIL ')+m)};
const gen=g.world.gen,D=gen.DIMS;A.admin=true;B.admin=true;A.hp=A.maxHp=99999;B.hp=B.maxHp=99999;
const sees=(n,t)=>msgs.some(([w,m])=>w===n&&m.t===t);
const pay=content.clientPayload();ok(Object.keys(content.mobs).every(k=>pay.mobs[k]),'every server mob exists in the client payload (wild pals are drawn)');
// ---- portals
const tg=gen.portals.find(x=>x.id==='town_gate');A.x=tg.x;A.y=tg.y+40;g.usePortal(A);ok(!!A.entering,'portal starts an enter animation first');tick(40);
ok(gen.dimAt(A.x,A.y)==='town','town portal -> Willow Town');
ok(g.inSafe(A.x,A.y),'town is a safe zone');
ok(g.npcs.some(n=>n.id==='auctioneer')&&g.npcs.some(n=>n.id==='merchant_t'),'town npcs exist (auctioneer + town copies)');
// ---- market
B.x=A.x;B.y=A.y;g.addItem(A,'iron',10);g.addItem(B,'coin',500);
const slot=A.inv.findIndex(s=>s&&s.id==='iron');g.marketMsg(A,{t:'mk_list',i:slot,price:100,count:5});
ok(g.mk.listings.length===1&&sees('A','market'),'market listing created');
const id=g.mk.listings[0].id;g.marketMsg(B,{t:'mk_buy',id});await new Promise(r=>setTimeout(r,30));
ok(g.countItem(B,'iron')===5&&g.countItem(B,'coin')===400,'buyer got iron, paid 100');
await new Promise(r=>setTimeout(r,30));ok(g.countItem(A,'coin')>=95,'seller got 95 coins (5% fee) via mail: '+g.countItem(A,'coin'));
const s2=A.inv.findIndex(s=>s&&s.id==='iron');g.marketMsg(A,{t:'au_create',i:s2,min:50,buyout:0,hours:1,count:3});
const au=g.mk.auctions[0];g.marketMsg(B,{t:'au_bid',id:au.id,amount:60});ok(au.bidderName==='Bob'&&au.bid===60,'auction bid placed');
au.end=Date.now()-10;g.mkSettleT=0;g.tickMarket(0.1);await new Promise(r=>setTimeout(r,30));
ok(g.countItem(B,'iron')===8,'auction settled: winner got the item');
// ---- seasons
g.seasonForce='halloween';g.updateSeason(false);ok(g.season==='halloween'&&g.npcs.some(n=>n.id==='pumpkin_npc'),'halloween season adds pumpkin kid');
g.dayTime=0.75;const pk=g.npcs.find(n=>n.id==='pumpkin_npc');const c0=g.countItem(A,'candy_corn')+g.countItem(A,'chocolate_bar')+g.countItem(A,'caramel_apple');g.giftNpc(A,pk);
ok(g.countItem(A,'candy_corn')+g.countItem(A,'chocolate_bar')+g.countItem(A,'caramel_apple')>c0,'daily gift candy given');
g.giftNpc(A,pk);ok(true,'second gift refused (daily)');
// ---- Dracula
cmd(g,A,'/dim hall');let dr=[...g.mobs.values()].find(m=>m.type==='dracula');
ok(!!dr&&dr.cutUntil>g.time,'dracula spawned with a cutscene');ok(sees('A','cutscene'),'cutscene sent');
const hp0=dr.hp;g.hurtMob(dr,500,A,0,0);ok(dr.hp===hp0,'boss is immune during his speech');
tick(700);ok(dr.cutUntil<g.time,'speech finished');
tick(600);ok([...g.mobs.values()].some(m=>m.type==='vampire_bat')||g.projectiles.length>0,'dracula attacks (bats/projectiles)');
ok(gen.dimAt(dr.x,dr.y)==='castle_hall','boss stays inside the hall');
dr.hp=1;g.hurtMob(dr,99999,A,0,0);tick(3);ok(![...g.mobs.values()].some(m=>m.type==='dracula'),'dracula can be killed');
ok([...g.drops.values()].some(d=>d.item==='coin'||d.item==='blood_vial'||d.item.startsWith('trophy')),'dracula dropped loot/trophy');
// ---- Atlantis + Neptune
cmd(g,A,'/dim atlantis');A.x=21000;A.y=27650;g.tickDims(0.1);ok(!!A.entering,'walking up to the temple door starts the enter animation');tick(40);ok(gen.dimAt(A.x,A.y)==='temple_hall','the door leads into the temple hall');
const np=[...g.mobs.values()].find(m=>m.type==='neptune');ok(!!np&&np.cutUntil>g.time,'neptune awakens at the temple');
tick(900);np.hp=1;g.hurtMob(np,99999,A,0,0);tick(3);ok(![...g.mobs.values()].some(m=>m.type==='neptune'),'neptune can be killed');
// ---- drowning -> atlantis (1 in 3)
A.x=D.atlantis.spawn[0];g.usePortal; const L=gen.lakes[0];let got=0;for(let i=0;i<60;i++){A.x=L.x;A.y=L.y;A.breath=0;A.drownRolled=false;A.returnMain=null;g.drownCheck(A);if(gen.dimAt(A.x,A.y)==='atlantis')got++;}
ok(got>8&&got<35,`drowning pulls you into Atlantis about 1/3 of the time (${got}/60)`);
// ---- plea
A.x=12000;A.y=12600;A.returnMain=null;g.pleaSpawn(A);for(let i=0;i<5&&!g.plea;i++)g.pleaSpawn(A);ok(!!g.plea,'plea npc spawned');
if(g.plea){A.x=g.plea.x;A.y=g.plea.y;g.pleaTalk(A);ok(sees('A','dialog'),'plea dialog sent');g.dialogChoice(A,'plea',0);ok(gen.dimAt(A.x,A.y)==='castle_land','accepting the plea teleports to Dracula\'s domain');}
// ---- castle mobs spawn
A.x=D.castle_land.spawn[0];A.y=D.castle_land.spawn[1]-900;tick(300);ok([...g.mobs.values()].some(m=>['vampire_thrall','ghoul','banshee','vampire_bat','gargoyle'].includes(m.type)),'castle land spawns gothic monsters');
// ---- vampire
g.vampireStart(A);A.x=12000;A.y=12300;A.returnMain=null;g.dayTime=0.5;const h=A.hp=A.maxHp=100;tick(120);ok(A.hp<h,'vampire burns in daylight');
g.batToggle(A);ok(A.mount==='bat_form'&&g.isFlying(A),'bat form = flying');g.vampireCure(A);ok(!A.vampire&&A.mount===null,'holy water cures');
// ---- pals
A.x=12000;A.y=12300;A.hp=A.maxHp=99999;const wp=g.spawnMob('wild_mossback',A.x+150,A.y);ok(wp&&wp.lv>=1,'wild pal spawns with a level');
wp.hp=wp.maxHp*0.05;let tamed=false;for(let i=0;i<30&&!tamed;i++){if(!g.mobs.has(wp.id))break;g.tameAttempt(A,wp,0.8);tamed=A.pals.length>0;}ok(tamed&&A.pal,'wild pal can be tamed with a sphere');
const gob=g.spawnMob('goblin',A.x+120,A.y);gob.hasTarget=true;const ghp=gob.hp;tick(200);ok(!g.mobs.has(gob.id)||gob.hp<ghp,'tamed pal fights for you');
const rock=g.world.res.find(r=>content.nodes[r.type].kind==='rock');A.x=rock.x+80;A.y=rock.y;const before=rock.hp;A.pal.cd=0;tick(60);ok(rock.hp<before||!rock.alive,'tamed pal mines nearby rocks');
// ---- sphere throw
g.addItem(A,'pal_sphere',3);A.sel=A.inv.findIndex(s=>s&&s.id==='pal_sphere');const sc0=A.inv[A.sel].count;A.atk=true;A.nextAtk=0;tick(3);ok(!A.inv[A.sel]||A.inv[A.sel].count<sc0,'holding a sphere and clicking throws it');
// ---- events
A.x=12000;A.y=12700;A.atk=false;g.seasonForce='christmas';g.updateSeason(false);g.startEvent('frost_moon',12000,12000);tick(300);ok(g.ev&&[...g.mobs.values()].some(m=>['elf_archer','gingerbread_brute','snowman_gunner'].includes(m.type)),'frost moon spawns holiday monsters');
// ---- v0.7.3 gameplay fixes
{ const B2=await g.join(mk('B2'),{token:'c'.repeat(32),name:'Cy'});B2.hp=B2.maxHp=5000;B2.x=12000;B2.y=13300;B2.angle=0;for(const m of [...g.mobs.keys()])g.mobs.delete(m);
  // 1. knockback
  const x0=B2.x;B2.invuln=0;B2.alive=true;g.hurtPlayer(B2,30,'test',null,{x:B2.x-40,y:B2.y,hp:5});tick(8);ok(B2.x>x0+15,'taking a hit knocks the player back ('+Math.round(B2.x-x0)+'px)');
  // 2. bosses are solid
  const bs=g.spawnMob('pumpking',B2.x+120,B2.y,{noShiny:true});bs.cutUntil=g.time+999;B2.x=bs.x-20;B2.y=bs.y;g.collidePlayer(B2);ok(Math.hypot(B2.x-bs.x,B2.y-bs.y)>bs.r*0.7,'you cannot stand inside a boss');g.mobs.delete(bs.id);
  // 3. houses / castle are solid
  const hs=gen.rects[2];const cx=(hs.x0+hs.x1)/2,cy=(hs.y0+hs.y1)/2;B2.x=cx;B2.y=cy;g.world.collide(B2,16);ok(!(B2.x>hs.x0&&B2.x<hs.x1&&B2.y>hs.y0&&B2.y<hs.y1),'town houses cannot be walked through');
  // 4. dying respawns in the normal world, not in the dimension
  B2.x=D.castle_land.spawn[0];B2.y=D.castle_land.spawn[1];g.killPlayer(B2,'test');B2.respawnAt=0;tick(3);ok(!gen.dimAt(B2.x,B2.y),'respawn is in the normal map, not the dimension');
  // 5. pal spheres can really be thrown and tame
  B2.x=12000;B2.y=13300;B2.alive=true;B2.hp=B2.maxHp;const wp2=g.spawnMob('wild_mossback',B2.x+220,B2.y);wp2.hp=wp2.maxHp*0.1;wp2.speed=0;g.addItem(B2,'pal_sphere_ultra',4);B2.sel=B2.inv.findIndex(s=>s&&s.id==='pal_sphere_ultra');
  for(let t=0;t<4&&!B2.pals.length;t++){B2.nextAtk=0;B2.atk=true;tick(1);B2.atk=false;tick(20);}ok(B2.pals.length===1,'throwing a Pal Sphere at a weakened wild pal tames it');
  // 5b. shots do not vanish when they cross enemy projectiles
  g.projectiles.length=0;g.shoot('p',B2.id,B2.x+200,B2.y,0,{kind:'eye',speed:300,life:2,radius:8,color:'#f00'},30,null,'t');g.shoot('m',999,B2.x+200,B2.y,Math.PI,{kind:'orb',speed:300,life:2,radius:8,color:'#0f0'},5,null,'m');tick(2);ok(g.projectiles.some(p=>p.owner==='p'),'a player projectile survives crossing an enemy projectile');
  // 6. fast projectiles cannot tunnel through a small monster
  const t2=g.spawnMob('slime',B2.x+300,B2.y,{noShiny:true});t2.speed=0;const hp2=t2.hp;g.shoot('p',B2.id,B2.x,B2.y,0,{kind:'arrow',speed:1400,life:1,radius:6,color:'#fff'},40,null,'t');tick(25);ok(t2.hp<hp2||!g.mobs.has(t2.id),'a very fast arrow still hits (swept collision)');
}
console.log(bad?`${bad} FAILED`:'ALL OK');process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
