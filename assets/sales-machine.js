(function(){
if(window.__DF_SALES_MACHINE_BOOTED)return;
window.__DF_SALES_MACHINE_BOOTED=true;
/* Shared assets and privacy-respecting, opt-in first-party analytics. */
(function(){
  if(!document.querySelector('link[href^="/assets/df-experience.css"]')){
    var link=document.createElement('link');link.rel='stylesheet';link.href='/assets/df-experience.css?v=20261013';link.dataset.dfExperience='1';document.head.appendChild(link);
  }
  if(!document.querySelector('script[src^="/assets/df-experience.js"]')){
    var script=document.createElement('script');script.src='/assets/df-experience.js?v=20261013';script.defer=true;script.dataset.dfExperience='1';document.head.appendChild(script);
  }
})();
(function(){
  'use strict';
  const ENDPOINT='https://qowjbytxepdkmatvidcj.supabase.co/functions/v1/track-website-event';
  const PUBLIC_KEY='sb_publishable_d1GZOixUAu5t_HwesfUxVA_7epWwvMV';
  const KEY='df_session_id';
  const START='df_session_started_at';
  let started=false;
  let sid='';
  const noop=function(){};
  let activeTrack=noop;
  let startedAt=Date.now();
  window.DFTrack=noop;

  function consent(){
    try{return localStorage.getItem('df_analytics_consent')||window.__dfAnalyticsConsent||null}
    catch(_){return window.__dfAnalyticsConsent||null}
  }
  function sessionValue(key){
    try{return sessionStorage.getItem(key)||''}catch(_){return ''}
  }
  function setSessionValue(key,value){
    try{sessionStorage.setItem(key,value)}catch(_){}
  }
  function safeReferrer(){
    try{return document.referrer?new URL(document.referrer).origin:''}catch(_){return ''}
  }
  function safeHref(href){
    try{const u=new URL(href,location.href);return u.origin+u.pathname}catch(_){return ''}
  }
  function send(body,payloadBase){
    try{
      const raw=JSON.stringify({...payloadBase,...body});
      fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','apikey':PUBLIC_KEY},body:raw,keepalive:true,credentials:'omit',referrerPolicy:'no-referrer'}).catch(()=>{});
    }catch(_){}
  }
  function startTracking(){
    if(started||consent()!=='accepted')return;
    started=true;
    sid=sessionValue(KEY);
    if(!sid){
      sid=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2));
      setSessionValue(KEY,sid);
    }
    const storedStart=Number(sessionValue(START));
    startedAt=storedStart>0?storedStart:Date.now();
    setSessionValue(START,String(startedAt));
    const params=new URLSearchParams(location.search);
    const ua=(navigator.userAgent||'').slice(0,80);
    const payloadBase={
      session_id:sid,
      landing_path:location.pathname.slice(0,500),
      referrer:safeReferrer(),
      device_type:/Mobi|Android|iPhone/i.test(ua)?'mobile':'desktop',
      browser:ua,
      utm_source:(params.get('utm_source')||'').slice(0,100),
      utm_medium:(params.get('utm_medium')||'').slice(0,100),
      utm_campaign:(params.get('utm_campaign')||'').slice(0,150),
      utm_term:(params.get('utm_term')||'').slice(0,150),
      utm_content:(params.get('utm_content')||'').slice(0,150)
    };
    function serviceSlug(pathname,serviceValue){
      if(serviceValue){
        return String(serviceValue).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100)||'general-enquiry';
      }
      const parts=String(pathname||'/').split('/').filter(Boolean);
      return parts.length?parts.slice(0,2).join('/').slice(0,100):'home';
    }
    function track(eventName,extra){
      if(consent()!=='accepted')return;
      const metadata=extra&&extra.metadata&&typeof extra.metadata==='object'?extra.metadata:{};
      const slug=(extra&&extra.service_slug)||serviceSlug(location.pathname,eventName==='lead_submitted'?metadata.service:'');
      send({event_name:String(eventName||'').slice(0,80),path:location.pathname.slice(0,500),service_slug:slug,...(extra||{})},payloadBase);
    }
    activeTrack=track;
    window.DFTrack=track;
    track('page_view',{metadata:{title:(document.title||'').slice(0,200)}});
    const trackedForms=new WeakSet();
    document.addEventListener('focusin',e=>{
      const field=e.target;
      if(!field||!field.closest||!field.matches('input,textarea,select'))return;
      const form=field.closest('form');
      if(!form||trackedForms.has(form))return;
      trackedForms.add(form);
      track('form_interaction',{metadata:{form_id:(form.id||'').slice(0,80)}});
    });
    document.addEventListener('click',e=>{
      const a=e.target&&e.target.closest&&e.target.closest('a,button');
      if(!a)return;
      const label=(a.innerText||a.getAttribute('aria-label')||'').trim().slice(0,100);
      const normalizedLabel=label.toLowerCase();
      if(/allow analytics|reject analytics|privacy choices|open navigation menu|close navigation menu/.test(normalizedLabel))return;
      const rawHref=a.getAttribute('href')||'';
      const href=a.href?safeHref(a.href):'';
      if(a.href&&/whatsapp|wa\.me/i.test(a.href)){
        track('whatsapp_click',{metadata:{label}});
        return;
      }
      if(a.href&&/domain-security-scanner|\/scan\//i.test(a.href)){
        track('scanner_cta_click',{metadata:{label}});
        return;
      }
      if(a.closest('form'))return;
      const isCta=a.matches('[data-track-cta],.btn,.button,.submit-button,.df-global-cta')
        ||!!a.closest('.cta,.closing')
        ||/\/get-started\//i.test(rawHref)
        ||/^mailto:/i.test(rawHref);
      if(isCta)track('cta_click',{metadata:{label,href}});
    });
    let hiddenAt=0;
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){hiddenAt=Date.now();track('session_pause')}
      else if(hiddenAt){track('session_resume',{metadata:{away_seconds:Math.round((Date.now()-hiddenAt)/1000)}});hiddenAt=0}
    });
    window.addEventListener('pagehide',()=>{
      const seconds=Math.max(0,Math.round((Date.now()-startedAt)/1000));
      track('page_exit',{metadata:{engaged_seconds:seconds}});
    });
  }

  window.addEventListener('df:analytics-consent',event=>{
    if(event.detail==='accepted'){if(started)window.DFTrack=activeTrack;else startTracking();}
    else if(event.detail==='rejected'){window.DFTrack=noop;}
  });
  if(consent()==='accepted')startTracking();
})();
})();
