import './styles.css';

const imageDrop = document.getElementById('imageDrop');
const videoDrop = document.getElementById('videoDrop');
const imageInput = document.getElementById('imageInput');
const videoInput = document.getElementById('videoInput');
const imagePreview = document.getElementById('imagePreview');
const videoPreview = document.getElementById('videoPreview');
const uploadBtn = document.getElementById('uploadBtn');
const progressBar = document.getElementById('progressBar');
const result = document.getElementById('result');

let imageFile = null;
let videoFile = null;

function preventDefaults(e){e.preventDefault();e.stopPropagation()}
['dragenter','dragover','dragleave','drop'].forEach(evt=>{
  imageDrop.addEventListener(evt,preventDefaults,false);
  videoDrop.addEventListener(evt,preventDefaults,false);
});

imageDrop.addEventListener('click',()=>imageInput.click());
videoDrop.addEventListener('click',()=>videoInput.click());

imageDrop.addEventListener('drop',async(e)=>{
  const f = e.dataTransfer.files[0];
  await handleImageFile(f);
});
videoDrop.addEventListener('drop',async(e)=>{
  const f = e.dataTransfer.files[0];
  await handleVideoFile(f);
});

imageInput.addEventListener('change',async(e)=>handleImageFile(e.target.files[0]));
videoInput.addEventListener('change',async(e)=>handleVideoFile(e.target.files[0]));

async function handleImageFile(f){
  if(!f) return;
  if(!f.type.startsWith('image/')) return alert('Please upload an image');
  // compress client-side
  const dataUrl = await compressImage(f,1500);
  imagePreview.innerHTML = `<img class="preview" src="${dataUrl}" alt="preview">`;
  const blob = dataURLtoBlob(dataUrl);
  imageFile = new File([blob], f.name, {type: blob.type});
}

async function handleVideoFile(f){
  if(!f) return;
  if(!f.type.startsWith('video/')) return alert('Please upload a video');
  // show preview object URL
  const url = URL.createObjectURL(f);
  videoPreview.innerHTML = `<video class="preview" src="${url}" controls muted playsinline></video>`;
  videoFile = f;
}

function dataURLtoBlob(dataurl){
  const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]);
  let n = bstr.length, u8arr = new Uint8Array(n);
  while(n--) u8arr[n]=bstr.charCodeAt(n);
  return new Blob([u8arr],{type:mime});
}

function compressImage(file,maxDim){
  return new Promise((res,rej)=>{
    const img = new Image();
    const reader = new FileReader();
    reader.onload = e=>{img.src = e.target.result};
    reader.onerror = rej;
    img.onload = ()=>{
      let w = img.width, h = img.height;
      if(w>maxDim||h>maxDim){
        const ratio = Math.max(w/h,w/h);
        if(w>h) { h = Math.round(h*(maxDim/w)); w = maxDim; }
        else { w = Math.round(w*(maxDim/h)); h = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img,0,0,w,h);
      const out = canvas.toDataURL('image/jpeg',0.85);
      res(out);
    };
    reader.readAsDataURL(file);
  });
}

uploadBtn.addEventListener('click',async()=>{
  if(!imageFile||!videoFile) return alert('Please provide both image and video');
  const loop = document.getElementById('loopOpt').checked;
  const caption = document.getElementById('caption').value || '';
  const password = document.getElementById('password').value || '';
  const expiry = document.getElementById('expiry').value;

  const fd = new FormData();
  fd.append('image', imageFile);
  fd.append('video', videoFile);
  fd.append('loop', loop);
  fd.append('caption', caption);
  fd.append('password', password);
  fd.append('expiry', expiry);

  progressBar.style.width = '0%';
  result.style.display='none';

  try{
    const API_BASE = window.__BACKEND_URL__ || 'http://localhost:5000';
  const res = await fetch(`${API_BASE}/api/upload`,{method:'POST',body:fd});
    if(!res.ok) throw new Error('Upload failed');
    // show fake progress while server processes
    await fakeProgress();
    const json = await res.json();
    showResult(json);
  }catch(err){
    alert(err.message||err);
  }
});

function fakeProgress(){
  return new Promise((res)=>{
    let p=0; const t=setInterval(()=>{p+=Math.random()*15; if(p>=95){p=95; clearInterval(t); res();} progressBar.style.width=p+'%';},200);
  });
}

function showResult(data){
  result.style.display='block';
  result.innerHTML='';
  const link = data.link || (location.origin + '/ar-viewer.html?id=' + (data.id||'unknown'));
  const div = document.createElement('div'); div.className='success';
  const left = document.createElement('div');
  left.innerHTML = `<p class="small">Your AR sticker is ready</p><p><a class="small" href="${link}" target="_blank">${link}</a></p>`;
  const qr = document.createElement('div'); qr.className='qr'; div.appendChild(left); div.appendChild(qr);
  result.appendChild(div);
  // generate QR
  if(window.QRCode){ new QRCode(qr, {text:link,width:140,height:140}); }
  const dl = document.createElement('a'); dl.className='btn'; dl.textContent='Download .mind (if available)'; dl.href=data.mindFileUrl||'#'; dl.download='target.mind'; result.appendChild(dl);
}
