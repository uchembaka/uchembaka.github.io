/* ============================================================
   Uche Mbaka — shared scripts
   ============================================================ */

/* ---------- theme toggle (persists across pages) ---------- */
(function(){
  var root = document.documentElement;
  var btn  = document.getElementById('themeToggle');
  function current(){ return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function sync(){
    var t = current();
    if(btn){
      btn.setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
      var lbl = document.getElementById('tmode');
      if(lbl) lbl.textContent = t === 'light' ? 'Light' : 'Dark';
    }
  }
  function apply(t){
    root.setAttribute('data-theme', t);
    try{ localStorage.setItem('theme', t); }catch(e){}
    sync();
    document.dispatchEvent(new Event('themechange'));
  }
  sync();
  if(btn){
    btn.addEventListener('click', function(){
      apply(current() === 'light' ? 'dark' : 'light');
    });
  }
})();

/* ---------- ambient field: a smooth curve recovered from sparse points ----------
   (only runs on pages that contain #field, i.e. the home page)            */
(function(){
  var canvas = document.getElementById('field');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var w=0,h=0,dpr=Math.min(window.devicePixelRatio||1,2);

  function resize(){
    var r = canvas.getBoundingClientRect();
    w=r.width; h=r.height;
    canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();
  window.addEventListener('resize', function(){ resize(); if(reduce) draw(0.6); });

  function palette(){
    var light = document.documentElement.getAttribute('data-theme') === 'light';
    return light ? {
      steel:'74,103,124', amber:'158,107,34', point:'27,28,32',
      glow:'rgba(158,107,34,0.22)', blur:9, echo:'rgba(74,103,124,0.14)', stem:'rgba(27,28,32,0.10)'
    } : {
      steel:'92,117,133', amber:'207,161,95', point:'233,230,223',
      glow:'rgba(207,161,95,0.5)', blur:16, echo:'rgba(92,117,133,0.10)', stem:'rgba(233,230,223,0.07)'
    };
  }

  function latent(x,t){
    return 0.5
      + 0.20*Math.sin(x*5.0 + t*0.45)
      + 0.12*Math.sin(x*9.3 - t*0.30 + 1.3)
      + 0.07*Math.sin(x*15.0 + t*0.62 + 2.1);
  }

  var N = 26, obs=[];
  for(var i=0;i<N;i++){
    obs.push({ x: Math.random(), j: Math.random()*6.28, n: (Math.random()-0.5)*0.09 });
  }

  function draw(t){
    var c = palette();
    ctx.clearRect(0,0,w,h);
    var midY = h*0.5;
    var amp  = Math.min(h*0.34, 230);
    var pad  = Math.max(w*0.02, 18);
    var X = function(x){ return pad + x*(w-2*pad); };
    var Y = function(v){ return midY - (v-0.5)*2*amp; };

    var grad = ctx.createLinearGradient(0,0,w,0);
    grad.addColorStop(0,   'rgba('+c.steel+',0.0)');
    grad.addColorStop(0.18,'rgba('+c.steel+',0.55)');
    grad.addColorStop(0.55,'rgba('+c.amber+',0.9)');
    grad.addColorStop(0.9, 'rgba('+c.amber+',0.4)');
    grad.addColorStop(1,   'rgba('+c.amber+',0.0)');

    ctx.lineWidth = 1.6;
    ctx.strokeStyle = grad;
    ctx.shadowColor = c.glow;
    ctx.shadowBlur = c.blur;
    ctx.beginPath();
    var steps = 220;
    for(var s=0;s<=steps;s++){
      var x = s/steps, px = X(x), py = Y(latent(x,t));
      if(s===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.lineWidth = 1;
    ctx.strokeStyle = c.echo;
    ctx.beginPath();
    for(var s2=0;s2<=steps;s2++){
      var x2=s2/steps, px2=X(x2), py2=Y(latent(x2, t-0.9))+14;
      if(s2===0) ctx.moveTo(px2,py2); else ctx.lineTo(px2,py2);
    }
    ctx.stroke();

    for(var k=0;k<N;k++){
      var o=obs[k];
      var ox=X(o.x);
      var trueV=latent(o.x,t);
      var noisy=trueV + o.n*Math.sin(t*0.5+o.j)*0.7 + o.n;
      var oy=Y(noisy), cy=Y(trueV);
      ctx.strokeStyle=c.stem;
      ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(ox,cy);ctx.lineTo(ox,oy);ctx.stroke();
      var tw = 0.35 + 0.65*Math.abs(Math.sin(t*0.8 + o.j));
      ctx.beginPath();
      ctx.arc(ox,oy,1.7,0,6.2832);
      ctx.fillStyle='rgba('+c.point+','+(0.20+0.32*tw)+')';
      ctx.fill();
      if(k%5===0){
        ctx.beginPath();
        ctx.arc(ox,oy,3.2,0,6.2832);
        ctx.fillStyle='rgba('+c.amber+','+(0.12+0.20*tw)+')';
        ctx.fill();
      }
    }
  }

  if(reduce){
    draw(0.6);
    document.addEventListener('themechange', function(){ draw(0.6); });
  }else{
    var start=null;
    function frame(ts){
      if(start===null) start=ts;
      draw((ts-start)/1000);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();

/* ---------- mobile hamburger nav ---------- */
(function(){
  var btn = document.getElementById('navToggle');
  var nav = document.getElementById('primary-nav');
  if(!btn || !nav) return;
  function close(){ nav.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', function(e){
    if(nav.classList.contains('open') && !nav.contains(e.target) && e.target !== btn) close();
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
  window.addEventListener('resize', function(){ if(window.innerWidth > 640) close(); });
})();

/* ---------- top bar tint on scroll ---------- */
(function(){
  var bar=document.getElementById('bar');
  if(!bar) return;
  function onScroll(){
    if(window.scrollY>40) bar.classList.add('scrolled');
    else bar.classList.remove('scrolled');
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  onScroll();
})();
