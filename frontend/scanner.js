// scanner.js - lazy-load MindAR + A-Frame and initialize on demand
const params = new URLSearchParams(location.search);
const id = params.get('id');
const cameraArea = document.getElementById('cameraArea');
const loading = document.getElementById('loading');
const pwOverlay = document.getElementById('passwordOverlay');
const pwInput = document.getElementById('pw');
const pwBtn = document.getElementById('pwBtn');

if(!location.protocol.startsWith('https:') && location.hostname !== 'localhost'){
  loading.textContent = 'Camera requires HTTPS. Please open via HTTPS.';
}

async function fetchSticker(){
  if(!id) throw new Error('Missing id');
  const API_BASE = window.__BACKEND_URL__ || 'http://localhost:5000';
  const res = await fetch(`${API_BASE}/ar/${id}`);
  if(!res.ok) throw new Error('Sticker not found');
  return await res.json();
}

function loadScript(src){
  return new Promise((res,rej)=>{
    const s=document.createElement('script'); s.src=src; s.async=true; s.onload=res; s.onerror=rej; document.head.appendChild(s);
  });
}

async function init(){
  try{
    const data = await fetchSticker();
    if(data.options && data.options.passwordProtected){
      pwOverlay.style.display='block';
      pwBtn.onclick = ()=>{
        if(pwInput.value===data.options.password){ pwOverlay.style.display='none'; startAR(data); } else alert('Wrong password');
      };
      return;
    }
    startAR(data);
  }catch(err){ loading.textContent = err.message; }
}

async function startAR(data){
  loading.textContent = 'Loading AR runtime…';
  // lazy load A-Frame and MindAR
  await loadScript('https://aframe.io/releases/1.4.0/aframe.min.js');
  await loadScript('https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-aframe.prod.js');

  // build scene
  const scene = document.createElement('a-scene');
  scene.setAttribute('embedded','');
  scene.setAttribute('mindar-image','imageTargetSrc: ' + data.mindFileUrl + '; maxTrack: 1');

  const assets = document.createElement('a-assets');
  const video = document.createElement('video');
  video.setAttribute('id','arVideo'); video.setAttribute('webkit-playsinline',''); video.setAttribute('playsinline',''); video.setAttribute('preload','auto');
  video.src = data.videoUrl;
  video.crossOrigin = 'anonymous';
  assets.appendChild(video);
  scene.appendChild(assets);

  const entity = document.createElement('a-entity');
  entity.setAttribute('mindar-image-target','targetIndex:0');

  const plane = document.createElement('a-video');
  plane.setAttribute('src','#arVideo');
  plane.setAttribute('position','0 0 0');
  plane.setAttribute('rotation','0 0 0');
  plane.setAttribute('visible','false');
  plane.setAttribute('height','0.8');
  plane.setAttribute('width','1');
  plane.setAttribute('material','shader: flat; opacity:0');

  entity.appendChild(plane);
  scene.appendChild(entity);
  cameraArea.innerHTML=''; cameraArea.appendChild(scene);

  // wire events
  scene.addEventListener('renderstart', async ()=>{
    const ar = scene.components['mindar-image'];
    // when target found
    scene.addEventListener('targetFound', ()=>{
      plane.setAttribute('visible','true');
      const v = document.getElementById('arVideo'); if(v){ v.play().catch(()=>{}); }
      // fade-in
      plane.setAttribute('animation__fade','property: material.opacity; to:1; dur:400; easing:easeInOutQuad');
      if(navigator.vibrate) navigator.vibrate(50);
    });
    scene.addEventListener('targetLost', ()=>{
      const v = document.getElementById('arVideo'); if(v){ v.pause(); }
      plane.setAttribute('animation__fadeout','property: material.opacity; to:0; dur:200');
    });
    try{ await ar.start(); }
    catch(e){ loading.textContent='Failed to start AR: '+e.message; }
    loading.style.display='none';
  });
}

init();
