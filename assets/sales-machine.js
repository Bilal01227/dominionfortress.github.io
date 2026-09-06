(function(){
  const ENDPOINT='https://qowjbytxepdkmatvidcj.supabase.co/functions/v1/track-website-event';
  const KEY='df_session_id';
  const params=new URLSearchParams(location.search);
  let sid=localStorage.getItem(KEY);
  if(!sid){sid=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random());localStorage.setItem(KEY,sid)}
  const ua=navigator.userAgent;
  const device=/Mobi|Android|iPhone/i.test(ua)?'mobile':'desktop';
  const payloadBase={session_id:sid,landing_path:location.pathname,referrer:document.referrer,device_type:device,browser:ua.slice(0,80),utm_source:params.get('utm_source')||'',utm_medium:params.get('utm_medium')||'',utm_campaign:params.get('utm_campaign')||'',utm_term:params.get('utm_term')||'',utm_content:params.get('utm_content')||''};
  function track(event_name,extra){try{navigator.sendBeacon&&navigator.sendBeacon(ENDPOINT,new Blob([JSON.stringify({...payloadBase,event_name,path:location.pathname,...(extra||{})})],{type:'application/json'}))||fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payloadBase,event_name,path:location.pathname,...(extra||{})}),keepalive:true})}catch(e){}}
  window.DFTrack=track;
  track('page_view');
  document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a,button');if(!a)return; const label=(a.innerText||a.getAttribute('aria-label')||'').trim().slice(0,100); if(a.href&&/whatsapp|wa\.me/i.test(a.href))track('whatsapp_click',{metadata:{label}}); else if(a.closest('form'))track('form_interaction',{metadata:{label}}); else track('cta_click',{metadata:{label,href:a.href||''}});});
})();