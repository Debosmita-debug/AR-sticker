const params = new URLSearchParams(location.search);
const id = params.get('id');
const wrap = document.getElementById('sceneWrap');

async function fetchData(){
  if(!id) throw new Error('Missing id');
  const API_BASE = window.__BACKEND_URL__ || 'http://localhost:5000';
  const r = await fetch(`${API_BASE}/ar/${id}`);
  if(!r.ok) throw new Error('Sticker not found');
  return await r.json();
}

function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.async=true;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}

async function init(){
  try{
    const data = await fetchData();
    if(data.expired){ wrap.textContent='This sticker has expired.'; return; }
    await loadScript('https://aframe.io/releases/1.4.0/aframe.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-aframe.prod.js');

    const scene = document.createElement('a-scene');
    scene.setAttribute('embedded','');
    scene.setAttribute('mindar-image','imageTargetSrc: ' + data.mindFileUrl + '; maxTrack: 1');
    const assets = document.createElement('a-assets');
    const video = document.createElement('video');
    video.setAttribute('id','arVideo'); video.src=''; video.setAttribute('playsinline',''); video.setAttribute('webkit-playsinline',''); video.crossOrigin='anonymous';
    assets.appendChild(video); scene.appendChild(assets);

    const entity = document.createElement('a-entity');
    entity.setAttribute('mindar-image-target','targetIndex:0');
    const plane = document.createElement('a-video'); plane.setAttribute('src','#arVideo'); plane.setAttribute('visible','false'); plane.setAttribute('material','shader:flat;opacity:0');
    entity.appendChild(plane); scene.appendChild(entity); wrap.innerHTML=''; wrap.appendChild(scene);

    scene.addEventListener('renderstart', ()=>{
      scene.addEventListener('targetFound', ()=>{
        if(video.src!=='') { video.play().catch(()=>{}); plane.setAttribute('visible','true'); plane.setAttribute('animation__fade','property:material.opacity;to:1;dur:400'); }
        else { video.src = data.videoUrl; video.load(); video.play().catch(()=>{}); plane.setAttribute('visible','true'); plane.setAttribute('animation__fade','property:material.opacity;to:1;dur:400'); }
      });
      scene.addEventListener('targetLost', ()=>{ video.pause(); plane.setAttribute('animation__fadeout','property:material.opacity;to:0;dur:200'); });
      try{ scene.components['mindar-image'].start(); }catch(e){wrap.textContent='AR start error: '+e.message}
    });
  }catch(e){ wrap.textContent = e.message }
}

init();
