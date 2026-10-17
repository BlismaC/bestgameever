// Player movement simulation shared by SERVER and CLIENT so client-side prediction matches exactly.
// state: {x,y,dashLeft,dashCd,dashDx,dashDy}   keys bitmask: 1 up, 2 down, 4 left, 8 right
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Movement = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const UP = 1, DOWN = 2, LEFT = 4, RIGHT = 8;
  // dt in seconds (<= 0.05). collide(state) pushes the state out of obstacles & clamps to the map.
  function step(st, keys, dash, aim, dt, cfg, mult, collide) {
    if (dash && st.dashCd <= 0 && st.dashLeft <= 0) {
      let dx = ((keys & RIGHT) ? 1 : 0) - ((keys & LEFT) ? 1 : 0), dy = ((keys & DOWN) ? 1 : 0) - ((keys & UP) ? 1 : 0);
      const l = Math.hypot(dx, dy);
      if (l) { dx /= l; dy /= l; } else { dx = Math.cos(aim); dy = Math.sin(aim); }
      st.dashDx = dx; st.dashDy = dy; st.dashLeft = cfg.dashTime; st.dashCd = cfg.dashCooldown;
    }
    let vx, vy;
    if (st.dashLeft > 0) { vx = st.dashDx * cfg.dashSpeed; vy = st.dashDy * cfg.dashSpeed; st.dashLeft -= dt; }
    else {
      let dx = ((keys & RIGHT) ? 1 : 0) - ((keys & LEFT) ? 1 : 0), dy = ((keys & DOWN) ? 1 : 0) - ((keys & UP) ? 1 : 0);
      const l = Math.hypot(dx, dy); if (l) { dx /= l; dy /= l; }
      vx = dx * cfg.speed * mult; vy = dy * cfg.speed * mult;
    }
    if (st.dashCd > 0) st.dashCd -= dt;
    st.x += vx * dt; st.y += vy * dt;
    collide(st);
    st.vx = vx; st.vy = vy;
  }
  return { step, UP, DOWN, LEFT, RIGHT };
});
