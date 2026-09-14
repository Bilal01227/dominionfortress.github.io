(function(){
  const ENDPOINT='https://qowjbytxepdkmatvidcj.supabase.co/functions/v1/track-website-event';
  const KEY='df_session_id';
  const START='df_session_started_at';
  const params=new URLSearchParams(location.search);
  let sid=localStorage.getItem(KEY);
  if(!sid){sid=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random());localStorage.setItem(KEY,sid)}
  if(!localStorage.getItem(START))localStorage.setItem(START,String(Date.now()));
  const ua=navigator.userAgent;
  const device=/Mobi|Android|iPhone/i.test(ua)?'mobile':'desktop';
  const payloadBase={session_id:sid,landing_path:location.pathname,referrer:document.referrer,device_type:device,browser:ua.slice(0,120),utm_source:params.get('utm_source')||'',utm_medium:params.get('utm_medium')||'',utm_campaign:params.get('utm_campaign')||'',utm_term:params.get('utm_term')||'',utm_content:params.get('utm_content')||''};
  function send(body){try{const raw=JSON.stringify({...payloadBase,...body});if(navigator.sendBeacon){const ok=navigator.sendBeacon(ENDPOINT,new Blob([raw],{type:'application/json'}));if(ok)return}fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:raw,keepalive:true}).catch(()=>{})}catch(e){}}
  function track(event_name,extra){send({event_name,path:location.pathname,...(extra||{})})}
  window.DFTrack=track;
  track('page_view',{metadata:{title:document.title}});
  document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a,button');if(!a)return;const label=(a.innerText||a.getAttribute('aria-label')||'').trim().slice(0,100);if(a.href&&/whatsapp|wa\.me/i.test(a.href))track('whatsapp_click',{metadata:{label,href:a.href}});else if(a.href&&/domain-security-scanner|\/scan\//i.test(a.href))track('scanner_cta_click',{metadata:{label,href:a.href}});else if(a.closest('form'))track('form_interaction',{metadata:{label}});else track('cta_click',{metadata:{label,href:a.href||''}})});
  let hiddenAt=0;
  document.addEventListener('visibilitychange',()=>{if(document.hidden){hiddenAt=Date.now();track('session_pause')}else if(hiddenAt){track('session_resume',{metadata:{away_seconds:Math.round((Date.now()-hiddenAt)/1000)}})}});
  window.addEventListener('pagehide',()=>{const started=Number(localStorage.getItem(START)||Date.now());track('page_exit',{metadata:{engaged_seconds:Math.max(0,Math.round((Date.now()-started)/1000))}})});
})();