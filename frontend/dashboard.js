let JWT = null; // stored in-memory
const loginBtn = document.getElementById('login');
const emailEl = document.getElementById('email');
const pwdEl = document.getElementById('pwd');
const list = document.getElementById('list');
const ctx = document.getElementById('chart').getContext('2d');

loginBtn.addEventListener('click', async ()=>{
  const API_BASE = window.__BACKEND_URL__ || 'http://localhost:5000';
  const res = await fetch(`${API_BASE}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:emailEl.value,password:pwdEl.value})});
  if(!res.ok) return alert('Login failed');
  const j = await res.json(); JWT = j.token;
  loadStickers();
});

async function loadStickers(){
  const API_BASE = window.__BACKEND_URL__ || 'http://localhost:5000';
  const r = await fetch(`${API_BASE}/api/auth/dashboard`,{headers:{'Authorization':'Bearer '+JWT}});
  if(!r.ok) return alert('Failed to fetch');
  const data = await r.json();
  list.innerHTML = '';
  data.stickers.forEach(s=>{
    const el = document.createElement('div'); el.className='row card';
    el.innerHTML = `<div style="flex:0 0 120px"><img src="${s.thumb}" style="width:100px;height:70px;object-fit:cover"/></div><div style="flex:1"><div class="small">${escapeText(s.caption)}</div><div class="small">Scans: ${s.scans} • ${new Date(s.created).toLocaleString()}</div></div>`;
    const copy = document.createElement('button'); copy.className='btn ghost'; copy.textContent='Copy Link'; copy.onclick=()=>navigator.clipboard.writeText(location.origin + '/ar-viewer.html?id='+s.id);
    const del = document.createElement('button'); del.className='btn ghost'; del.textContent='Delete'; del.onclick=async ()=>{ if(confirm('Delete?')){ await fetch('/api/delete/'+s.id,{method:'DELETE',headers:{'Authorization':'Bearer '+JWT}}); loadStickers(); }};
    el.appendChild(copy); el.appendChild(del); list.appendChild(el);
  });
  renderChart(data.chartLabels,data.chartValues);
}

function renderChart(labels,values){
  new Chart(ctx,{type:'line',data:{labels, datasets:[{label:'Scans',data:values, borderColor:'#7C3AFF', backgroundColor:'rgba(124,58,255,0.12)'}]}});
}

function escapeText(t){ const div=document.createElement('div'); div.textContent=t; return div.innerHTML; }
