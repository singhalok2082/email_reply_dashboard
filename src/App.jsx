import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { getSession, setSession, clearSession } from './lib/auth'

function isAdmin(session){
  if(!session) return false
  const role=(session.role||'').toLowerCase()
  return role==='admin'||role==='consultadd admin'||role==='conultadd admin'||session.is_admin===true
}

/* ============================================================
   HOOKS ALIASES (match inline style used throughout)
   ============================================================ */
const uS = useState
const uE = useEffect
const uM = useMemo
const uR = useRef

/* ============================================================
   ICONS
   ============================================================ */
const ICONS={
  inbox:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="16" height="12" rx="2"/><path d="M2 10h4l1.5 2h5L14 10h4"/></svg>,
  user:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="7" r="3"/><path d="M4 18c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  users:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="7" r="2.5"/><path d="M3 18c0-2.8 2.2-5 5-5h0c2.8 0 5 2.2 5 5"/><circle cx="14" cy="7" r="2"/><path d="M17 18c0-2.2-1.6-4-3.5-4.4"/></svg>,
  campaign:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10c0-3.9 3.1-7 7-7s7 3.1 7 7-3.1 7-7 7"/><circle cx="10" cy="10" r="2.5"/><path d="M10 3v2M10 15v2M3 10h2M15 10h2"/></svg>,
  shield:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2l6 2.5v5c0 4-2.5 6.5-6 8-3.5-1.5-6-4-6-8v-5L10 2z"/></svg>,
  chart:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="12" width="3" height="5" rx="1"/><rect x="8.5" y="8" width="3" height="9" rx="1"/><rect x="14" y="4" width="3" height="13" rx="1"/></svg>,
  search:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8.5" cy="8.5" r="5"/><path d="M15 15l-3-3"/></svg>,
  more:<svg viewBox="0 0 20 20" fill="currentColor"><circle cx="5" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="15" cy="10" r="1.5"/></svg>,
  logout:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4h3a1 1 0 011 1v10a1 1 0 01-1 1h-3M9 14l4-4-4-4M13 10H4"/></svg>,
  check:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10l4 4 8-8"/></svg>,
  checkCircle:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="8"/><path d="M6.5 10l2.5 2.5 5-5"/></svg>,
  star:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L10 13l-4.2 2.5.8-4.7-3.4-3.3 4.7-.7z"/></svg>,
  starF:<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L10 13l-4.2 2.5.8-4.7-3.4-3.3 4.7-.7z"/></svg>,
  clip:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 9l-7 7a4 4 0 01-5.7-5.7L10 3.7A2.5 2.5 0 0113.5 7l-6.6 6.6a1 1 0 01-1.4-1.4L12 5.6"/></svg>,
  archive:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="16" height="4" rx="1"/><path d="M3 7v9a1 1 0 001 1h12a1 1 0 001-1V7M8 11h4"/></svg>,
  snooze:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="11" r="7"/><path d="M10 4V2M7 1.5l6 0M7.5 8.5h5l-5 5h5"/></svg>,
  mail:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="16" height="12" rx="2"/><path d="M2 7l8 5 8-5"/></svg>,
  tag:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h6.5l7 7a2 2 0 010 2.8L13 16.3a2 2 0 01-2.8 0l-7-7V3zM7 7h.01"/></svg>,
  trash:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h14M8 5V3h4v2M5 5l1 12h8l1-12"/></svg>,
  refresh:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10a6 6 0 106-6H7"/><path d="M7 1v3h3"/></svg>,
  sort:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h14M6 10h8M9 15h2"/></svg>,
  arrowL:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4l-6 6 6 6"/></svg>,
  arrowR:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4l6 6-6 6"/></svg>,
  plus:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M10 4v12M4 10h12"/></svg>,
  x:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>,
  chevD:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8l5 5 5-5"/></svg>,
  lock:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6a3 3 0 016 0v3"/></svg>,
  external:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M11 3h6v6M17 3l-8 8M9 5H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-5"/></svg>,
  expand:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5"/></svg>,
  printer:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="13" width="10" height="5" rx="1"/><path d="M5 13V7h10v6M5 9H2V5h16v4h-3"/></svg>,
  dotsV:<svg viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="5" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="10" cy="15" r="1.5"/></svg>,
  panel:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="16" height="14" rx="2"/><path d="M13 3v14"/></svg>,
  reply:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7l-5 4 5 4V12c4 0 7 1.5 8 4.5C16 11 13 7 8 8V7z"/></svg>,
  replyAll:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7l-4 4 4 4v-3c4 0 7 1.5 8 4.5C13 11 10 7 5 8V7z"/><path d="M9 9l-2 2 2 2"/></svg>,
  forward:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 7l5 4-5 4v-3c-4 0-7 1.5-8 4.5C4 11 7 7 12 8V7z"/></svg>,
  send:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2L2 9l6 2 2 7 8-16z"/><path d="M8 11l10-9"/></svg>,
  sparkle:<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5z"/></svg>,
  bold:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h6a3 3 0 010 6H6zM6 10h7a3 3 0 010 6H6z"/></svg>,
  italic:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M10 4h4M6 16h4M12 4l-4 12"/></svg>,
  link:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12l4-4M11 7l2-2a3 3 0 014.2 4.2l-3 3a3 3 0 01-4.2 0M9 13l-2 2a3 3 0 01-4.2-4.2l3-3a3 3 0 014.2 0"/></svg>,
  smile:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="8"/><path d="M7 12s1 2 3 2 3-2 3-2"/><circle cx="7.5" cy="8.5" r="1" fill="currentColor" stroke="none"/><circle cx="12.5" cy="8.5" r="1" fill="currentColor" stroke="none"/></svg>,
  download:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3v11M6 10l4 4 4-4M3 17h14"/></svg>,
  fileText:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H5a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V6l-4-4z"/><path d="M12 2v4h4M7 9h6M7 12h6M7 15h4"/></svg>,
  clock:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="8"/><path d="M10 5v5l3 3"/></svg>,
  linkedin:<svg viewBox="0 0 20 20" fill="currentColor"><path d="M5 7H3v10h2V7zM4 6a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 17h2v-5c0-1.7.8-2.5 2-2.5 1 0 1.8.6 1.8 2.5V17h2v-5.5C15.8 9 14.3 7 12 7c-1.3 0-2.3.6-3 1.5V7H7c0 .7.1 10 .1 10H8z"/></svg>,
  alert:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3L2 17h16L10 3z"/><path d="M10 9v4M10 14.5v.5"/></svg>,
  eye:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z"/><circle cx="10" cy="10" r="2.5"/></svg>,
}
function Icon({name,size=18,style,className}){
  const el=ICONS[name]
  if(!el) return <span style={{width:size,height:size,display:'inline-block',...style}}/>
  return <el.type {...el.props} width={size} height={size} style={{display:'block',flex:'none',...style}} className={className}/>
}

/* ============================================================
   PRIMITIVES
   ============================================================ */
function initials(name){const p=(name||'').trim().split(/\s+/);return((p[0]?.[0]||'')+(p[1]?.[0]||'')).toUpperCase()||(name||'?')[0]?.toUpperCase()||'?'}
const AV_COLORS=['var(--a-terra)','var(--a-slate)','var(--a-green)','var(--a-gold)','var(--a-plum)','var(--a-teal)','var(--a-indigo)','var(--a-rose)']
function colorFor(seed){let h=0;for(const c of(seed||''))h=(h*31+c.charCodeAt(0))>>>0;return AV_COLORS[h%AV_COLORS.length]}
function Avatar({name,color,size='md',style}){
  const bg=color||colorFor(name)
  return <div className={`av av-${size}`} style={{background:bg,color:'#fff',...style}}><span>{initials(name)}</span></div>
}
const INTENT={
  interested:{label:'Interested',cls:'interested',dot:'var(--green)'},
  new:{label:'New',cls:'new',dot:'var(--blue)'},
  meeting:{label:'Meeting',cls:'meeting',dot:'var(--violet)'},
  ooo:{label:'OOO',cls:'ooo',dot:'var(--amber)'},
  unsubscribe:{label:'Unsubscribe',cls:'unsubscribe',dot:'var(--red)'},
  nurture:{label:'Nurture',cls:'nurture',dot:'var(--ink-3)'},
}
function normalizeIntent(s){
  if(!s) return 'new'
  const m={'new':'new','interested':'interested','meeting':'meeting','ooo':'ooo','unsubscribe':'unsubscribe','nurture':'nurture','follow up':'nurture','replied':'nurture'}
  return m[s.toLowerCase()]||'new'
}
function IntentBadge({intent}){
  const m=INTENT[intent]||INTENT.new
  return <span className={`badge ${m.cls}`}><span className="bdot" style={{background:m.dot}}/>{m.label}</span>
}
function Seg({options,value,onChange,size}){
  return <div style={{display:'inline-flex',gap:3,padding:3,background:'var(--surface-inset)',border:'1px solid var(--line-2)',borderRadius:9}}>
    {options.map(o=>{const v=o.value??o,lbl=o.label??o,on=v===value
      return <button key={v} onClick={()=>onChange(v)} style={{display:'inline-flex',alignItems:'center',gap:6,height:size==='sm'?26:30,padding:'0 12px',borderRadius:6,border:'none',fontWeight:600,fontSize:size==='sm'?12:12.5,background:on?'var(--surface)':'transparent',color:on?'var(--ink)':'var(--ink-3)',boxShadow:on?'var(--sh-xs)':'none',transition:'.12s'}}>
        {lbl}{o.count!=null&&<span className="tnum" style={{color:on?'var(--ink-3)':'var(--ink-4)',fontWeight:600}}>{o.count}</span>}
      </button>
    })}
  </div>
}
function Stat({label,value,sub,accent}){
  return <div className="card" style={{padding:'16px 18px'}}>
    <div className="kicker" style={{marginBottom:10}}>{label}</div>
    <div className="metric-num" style={{fontSize:30,color:accent||'var(--ink)'}}>{value}</div>
    {sub&&<div className="faint" style={{fontSize:12.5,marginTop:7}}>{sub}</div>}
  </div>
}
function Dot({color,size=8}){return <span style={{width:size,height:size,borderRadius:'50%',background:color,display:'inline-block',flex:'none'}}/>}
function MeterBar({value,max,color,h=8}){
  const pct=max?Math.round(value/max*100):0
  return <div style={{height:h,borderRadius:99,background:'var(--surface-inset)',overflow:'hidden'}}>
    <div style={{width:pct+'%',height:'100%',background:color||'var(--primary)',borderRadius:99,transition:'.3s'}}/>
  </div>
}
function Donut({pct,size=100,stroke=10,color='var(--primary)',children}){
  const r=(size-stroke)/2,circ=2*Math.PI*r,off=circ*(1-pct/100)
  return <div style={{position:'relative',display:'inline-grid',placeItems:'center',width:size,height:size}}>
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:'rotate(-90deg)',gridArea:'1/1'}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-inset)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"/>
    </svg>
    <div style={{gridArea:'1/1',textAlign:'center',pointerEvents:'none'}}>{children}</div>
  </div>
}
function Popover({open,onClose,children,style}){
  uE(()=>{if(!open)return;const h=()=>onClose();window.addEventListener('click',h);return()=>window.removeEventListener('click',h)},[open])
  if(!open)return null
  return <div onClick={e=>e.stopPropagation()} className="fade-in" style={{position:'absolute',zIndex:50,background:'var(--surface)',border:'1px solid var(--line)',borderRadius:12,boxShadow:'var(--sh-pop)',padding:6,minWidth:200,...style}}>{children}</div>
}
function MenuItem({children,onClick,active}){
  return <button onClick={onClick} style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'8px 10px',borderRadius:8,border:'none',background:active?'var(--primary-tint)':'transparent',color:active?'var(--primary-ink)':'var(--ink)',fontSize:13,fontWeight:500,textAlign:'left',transition:'.1s'}}
    onMouseEnter={e=>{if(!active)e.currentTarget.style.background='var(--surface-inset)'}}
    onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent'}}>{children}</button>
}
function Checkbox({on,indeterminate,onClick}){
  return <button onClick={e=>{e.stopPropagation();onClick()}} className="cbx" data-on={on?'1':undefined}>
    {on&&<Icon name="check" size={13}/>}
    {indeterminate&&!on&&<span style={{width:9,height:2,background:'#fff',borderRadius:2}}/>}
  </button>
}

/* ============================================================
   DATA HELPERS — map Supabase rows to UI thread objects
   ============================================================ */
function rowToThread(r){
  const messages=[]
  if(r.sent_email_body){
    messages.push({
      from:'me',
      author: r.sending_email||'ConsultAdd',
      email: r.sending_email||'',
      date: fmtDateLong(r.created_at),
      time: '',
      body: r.sent_email_body,
    })
  }
  messages.push({
    from:'lead',
    author: r.lead_name||r.lead_email||'Lead',
    email: r.lead_email||'',
    date: fmtDateLong(r.created_at),
    time: fmtTime(r.created_at),
    body: r.reply_body||r.reply_full||'(no content)',
  })
  return {
    id: r.id,
    campaign: r.campaign_name||'',
    subject: r.reply_subject||'(no subject)',
    lead:{
      name: r.lead_name||r.lead_email||'Unknown',
      email: r.lead_email||'',
      domain: (r.lead_email||'').split('@')[1]||'',
      title: r.lead_title||'',
      company: r.company||'',
      phone: '',
      location: '',
      jobTitle: r.reply_subject||'',
      linkedin: r.job_url||'#',
    },
    intent: normalizeIntent(r.status),
    assignee: r.poc||null,
    ts: fmtDate(r.created_at),
    unread: r.status==='New'||!r.status,
    starred: false,
    done: ['Archive','Unsubscribe'].includes(r.status),
    sla: 'ok',
    sdr_notes: r.sdr_notes||'',
    messages,
  }
}
function fmtDate(iso){
  if(!iso) return ''
  const d=new Date(iso),now=new Date()
  const diff=now-d
  if(diff<86400000) return d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})
  if(diff<172800000) return 'Yesterday'
  return d.toLocaleDateString([],{month:'short',day:'numeric'})
}
function fmtDateLong(iso){
  if(!iso) return ''
  return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
}
function fmtTime(iso){
  if(!iso) return ''
  return new Date(iso).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})
}

/* ============================================================
   LOGIN SCREEN
   ============================================================ */
function LoginScreen({onLogin}){
  const [email,setEmail]=uS('')
  const [pass,setPass]=uS('')
  const [show,setShow]=uS(false)
  const [err,setErr]=uS('')
  const [busy,setBusy]=uS(false)

  async function submit(e){
    e&&e.preventDefault()
    setErr('')
    if(!email.trim()){setErr('Enter your email.');return}
    if(!pass){setErr('Enter your PIN.');return}
    setBusy(true)
    try{
      const {data,error}=await supabase
        .from('poc_profiles')
        .select('*')
        .eq('email',email.trim().toLowerCase())
        .single()
      if(error||!data){setErr('No account found for that email.');setBusy(false);return}
      if(data.pin!==pass){setErr('Incorrect PIN.');setBusy(false);return}
      const sess={id:data.name,name:data.name,email:data.email,role:data.role,color:data.color,
        is_admin:['admin','Admin','Conultadd Admin','Consultadd Admin'].includes(data.role)}
      setSession(sess)
      onLogin(sess)
    }catch(e){setErr('Login failed. Try again.');setBusy(false)}
  }

  const inputStyle={
    display:'block',width:'100%',height:46,padding:'0 14px',
    borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',
    background:'rgba(255,255,255,0.05)',fontSize:14,
    fontFamily:'var(--font-ui)',color:'#fff',outline:'none',transition:'.15s',
    marginBottom:18,
  }
  const onF=e=>e.target.style.borderColor='rgba(45,212,191,0.5)'
  const onB=e=>e.target.style.borderColor='rgba(255,255,255,0.1)'

  return <div style={{height:'100%',position:'relative',overflow:'auto',
    background:'radial-gradient(ellipse at 60% 35%,rgba(14,107,102,0.22) 0%,transparent 60%),radial-gradient(ellipse at 20% 75%,rgba(14,107,102,0.1) 0%,transparent 50%),#0A0D0F'}}>
    {/* grid overlay */}
    <div style={{position:'fixed',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',backgroundSize:'64px 64px',pointerEvents:'none'}}/>
    {/* orbital motif */}
    <svg style={{position:'fixed',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:0.5}} viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
      {[0,1,2,3,4,5].map(i=><ellipse key={i} cx="500" cy="500" rx={150+i*88} ry={300+i*46} fill="none" stroke="rgba(45,212,191,0.07)" strokeWidth="1.2" transform={`rotate(${-28+i*7} 500 500)`}/>)}
    </svg>
    <div style={{position:'relative',minHeight:'100%',display:'grid',placeItems:'center',padding:'48px 24px'}}>
      <div style={{width:'100%',maxWidth:400}}>
        {/* logo */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:36}}>
          <div style={{width:32,height:32,borderRadius:9,background:'rgba(14,107,102,0.25)',border:'1px solid rgba(45,212,191,0.35)',display:'grid',placeItems:'center',fontFamily:'var(--font-display)',fontSize:16,color:'#2DD4BF',fontWeight:400}}>C</div>
          <span style={{fontFamily:'var(--font-display)',fontWeight:400,fontSize:18,color:'#fff',letterSpacing:'-0.01em'}}>ConsultADD</span>
          <span style={{marginLeft:'auto',fontSize:10,letterSpacing:'.12em',color:'rgba(255,255,255,0.25)',textTransform:'uppercase',fontFamily:'var(--font-mono)'}}>Replyloop</span>
        </div>
        {/* headline */}
        <div style={{fontSize:11,fontWeight:600,letterSpacing:'.12em',color:'#2DD4BF',textTransform:'uppercase',marginBottom:12,fontFamily:'var(--font-mono)'}}>Reply Manager</div>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(32px,5vw,48px)',fontWeight:400,lineHeight:1.08,letterSpacing:'-.02em',color:'#fff',margin:'0 0 12px'}}>Every reply,<br/><em style={{fontStyle:'italic',color:'rgba(255,255,255,0.55)'}}>in one loop.</em></h1>
        <p style={{fontSize:14,color:'rgba(255,255,255,0.38)',lineHeight:1.65,marginBottom:32}}>Sign in to track, route and answer every reply from every Instantly campaign.</p>
        {/* card */}
        <div style={{borderRadius:20,padding:'28px 26px',background:'rgba(255,255,255,0.03)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',boxShadow:'inset 0 1px 1px rgba(255,255,255,0.07),0 24px 64px rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <form onSubmit={submit}>
            <label style={{fontSize:10.5,fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',display:'block',marginBottom:8}}>Work email</label>
            <input style={inputStyle} type="email" placeholder="you@consultadd.com" value={email} onChange={e=>setEmail(e.target.value)} autoFocus onFocus={onF} onBlur={onB}/>
            <label style={{fontSize:10.5,fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',display:'block',marginBottom:8}}>Password (PIN)</label>
            <div style={{position:'relative',marginBottom:22}}>
              <input style={{...inputStyle,marginBottom:0,paddingRight:44}} type={show?'text':'password'} placeholder="••••" value={pass} onChange={e=>setPass(e.target.value)} onFocus={onF} onBlur={onB}/>
              <button type="button" onClick={()=>setShow(s=>!s)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',display:'grid',placeItems:'center',padding:4}}><Icon name="eye" size={17}/></button>
            </div>
            {err&&<div style={{display:'flex',alignItems:'center',gap:7,marginBottom:14,color:'#f87171',fontSize:13,fontWeight:500}}><Icon name="alert" size={15}/>{err}</div>}
            <button type="submit" disabled={busy} style={{width:'100%',height:48,borderRadius:10,border:'none',background:'#0E6B66',color:'#fff',fontSize:14.5,fontWeight:600,cursor:busy?'not-allowed':'pointer',fontFamily:'var(--font-ui)',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'background .2s,transform .15s',opacity:busy?0.6:1}}>
              {busy?'Signing in…':<>Sign in <Icon name="arrowR" size={17}/></>}
            </button>
          </form>
        </div>
        <p style={{marginTop:20,fontSize:12,color:'rgba(255,255,255,0.2)',textAlign:'center'}}>← <a href="https://consultadd-site-production.up.railway.app" style={{color:'rgba(255,255,255,0.3)',textDecoration:'none'}}>Back to ConsultADD</a></p>
      </div>
    </div>
  </div>
}

/* ============================================================
   THREAD READER + COMPOSER + LEAD PANEL
   ============================================================ */
const QUICK=[
  {label:'Send resume',text:`Thanks for the quick reply — happy to share. Please find my resume attached. I'm a strong match and available to talk this week.`},
  {label:'Confirm work auth',text:`To confirm: I'm authorized to work in the U.S. and open to relocating for the right opportunity. Resume attached for your review.`},
  {label:'Propose times',text:`I'd love to connect. I'm free Thursday 2–5pm ET or Friday morning ET — let me know what works and I'll send an invite.`},
]
function Message({m,leadName,open,onToggle,isLast}){
  const mine=m.from==='me'
  const snippet=m.body.replace(/\n+/g,' ').slice(0,92)
  if(!open){
    return <button className="msg-collapsed" onClick={onToggle}>
      {mine?<span className="msg-av-me">{initials(m.author)}</span>:<Avatar name={m.author} size="sm"/>}
      <span style={{fontWeight:600,fontSize:13,whiteSpace:'nowrap'}}>{mine?'You':m.author.split(',')[0]}</span>
      <span className="faint" style={{fontSize:12.5,flex:1,minWidth:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{snippet}</span>
      <span className="faint" style={{fontSize:11.5,whiteSpace:'nowrap',flex:'none'}}>{m.time}</span>
    </button>
  }
  return <div className={'msg'+(mine?' msg-mine':'')}>
    <div className="msg-head">
      {mine?<span className="msg-av-me md">{initials(m.author)}</span>:<Avatar name={m.author} size="md"/>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'baseline',gap:7,flexWrap:'wrap'}}>
          <span style={{fontWeight:700,fontSize:14}}>{mine?'You':m.author}</span>
          <span className="mono faint" style={{fontSize:11.5}}>&lt;{m.email}&gt;</span>
        </div>
        <div className="faint" style={{fontSize:11.5,marginTop:1}}>{mine?'to '+leadName.split(' ')[0]:'to me'}</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:2,flex:'none'}}>
        <span className="faint" style={{fontSize:11.5,marginRight:6,whiteSpace:'nowrap'}}>{m.date} · {m.time}</span>
        <button className="icon-btn" style={{width:28,height:28}}><Icon name="reply" size={16}/></button>
        <button className="icon-btn" style={{width:28,height:28}}><Icon name="dotsV" size={16}/></button>
      </div>
    </div>
    <div className="msg-body">{m.body}</div>
  </div>
}
function Composer({thread,handler,onSend}){
  const [mode,setMode]=uS('reply')
  const [draft,setDraft]=uS('')
  const [cc,setCc]=uS(false)
  const fwd=mode==='forward'
  async function submit(){
    if(!draft.trim())return
    // Save reply to Supabase
    await supabase.from('instantly_replies').update({sdr_notes:draft.trim()}).eq('id',thread.id)
    onSend(draft.trim())
    setDraft('')
  }
  return <div className="composer">
    <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
      {QUICK.map(q=><button key={q.label} onClick={()=>setDraft(d=>d?d:q.text)} className="tmpl-chip"><Icon name="sparkle" size={12}/>{q.label}</button>)}
    </div>
    <div className="composer-card">
      <div className="composer-tabs">
        {[['reply','reply','Reply'],['replyAll','replyAll','Reply all'],['forward','forward','Forward']].map(([v,ic,lbl])=>
          <button key={v} className={'ctab'+(mode===v?' on':'')} onClick={()=>setMode(v)}><Icon name={ic} size={14}/>{lbl}</button>)}
        <span style={{marginLeft:'auto'}}/>
        <button className="ctab" onClick={()=>setCc(s=>!s)} data-on={cc?'1':undefined}>Cc/Bcc</button>
      </div>
      <div className="composer-field"><span className="cf-label">To</span><span className="cf-val mono">{fwd?'':thread.lead.email}</span></div>
      {cc&&<div className="composer-field"><span className="cf-label">Cc</span><span className="faint" style={{fontSize:12.5}}>Add Cc…</span></div>}
      <div className="composer-field"><span className="cf-label">Subj</span><span className="cf-val">{(fwd?'Fwd: ':'')+thread.subject.replace(/^(Re|Fwd):\s*/i,'Re: ')}</span></div>
      <textarea value={draft} onChange={e=>setDraft(e.target.value)} rows={4} placeholder={`Write your ${fwd?'forward note':'reply'}…`} className="composer-text"/>
      <div className="composer-bar">
        <div style={{display:'flex',gap:1}}>
          {['bold','italic','link'].map(b=><button key={b} className="icon-btn" style={{width:30,height:30}}><Icon name={b} size={16}/></button>)}
          <span style={{width:1,background:'var(--line)',margin:'5px 4px'}}/>
          <button className="icon-btn" style={{width:30,height:30}}><Icon name="clip" size={16}/></button>
          <button className="icon-btn" style={{width:30,height:30}}><Icon name="smile" size={16}/></button>
        </div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
          <button className="icon-btn" style={{width:32,height:32}} onClick={()=>setDraft('')}><Icon name="trash" size={16}/></button>
          <button className="btn primary sm" onClick={submit} disabled={!draft.trim()}><Icon name="send" size={15}/> Send</button>
        </div>
      </div>
    </div>
  </div>
}
function ThreadReader({thread,handler,isAdmin,onUpdate,onClose,handlers,leadOpen,onToggleLead}){
  const [expanded,setExpanded]=uS(()=>new Set([thread.messages.length-1]))
  const [reassignOpen,setReassignOpen]=uS(false)
  const [moreOpen,setMoreOpen]=uS(false)
  const scrollRef=uR(null)
  uE(()=>{setExpanded(new Set([thread.messages.length-1]));if(scrollRef.current)scrollRef.current.scrollTop=0},[thread.id])
  function toggle(i){setExpanded(s=>{const n=new Set(s);n.has(i)?n.delete(i):n.add(i);return n})}
  function expandAll(){setExpanded(new Set(thread.messages.map((_,i)=>i)))}
  const intents=['new','interested','meeting','ooo','unsubscribe']
  function send(body){
    const now=new Date()
    const nm={from:'me',author:handler.name,email:handler.email,date:fmtDateLong(now.toISOString()),time:fmtTime(now.toISOString()),body}
    onUpdate(thread.id,{messages:[...thread.messages,nm]})
    setTimeout(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight},60)
  }
  const collapsedCount=thread.messages.length-expanded.size
  return <div className="reader">
    <div className="reader-toolbar">
      <button className="ico-act" onClick={()=>onUpdate(thread.id,{done:true})} title="Archive"><Icon name="archive" size={18}/></button>
      <button className="ico-act" onClick={()=>onUpdate(thread.id,{done:!thread.done})} data-active={thread.done?'1':undefined} title="Mark done"><Icon name="check" size={18}/></button>
      <button className="ico-act" title="Label"><Icon name="tag" size={18}/></button>
      <span className="tb-sep"/>
      {isAdmin&&<div style={{position:'relative'}}>
        <button className="btn sm" onClick={e=>{e.stopPropagation();setReassignOpen(o=>!o)}}><Icon name="users" size={15}/> Reassign <Icon name="chevD" size={13}/></button>
        <Popover open={reassignOpen} onClose={()=>setReassignOpen(false)} style={{top:38,left:0}}>
          <div className="kicker" style={{padding:'6px 10px 4px'}}>Assign to</div>
          {handlers.map(h=><MenuItem key={h.id} active={thread.assignee===h.id} onClick={()=>{onUpdate(thread.id,{assignee:h.id,poc:h.name});setReassignOpen(false)}}>
            <Avatar name={h.name} color={h.color} size="xs"/>{h.name}
            {thread.assignee===h.id&&<Icon name="check" size={15} style={{marginLeft:'auto'}}/>}
          </MenuItem>)}
          <hr className="divider" style={{margin:'5px 6px'}}/>
          <MenuItem onClick={()=>{onUpdate(thread.id,{assignee:null,poc:null});setReassignOpen(false)}}>
            <span className="unassign-dot"><Icon name="x" size={11}/></span>Unassign
          </MenuItem>
        </Popover>
      </div>}
      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:2}}>
        <div style={{position:'relative'}}>
          <button className="ico-act" onClick={e=>{e.stopPropagation();setMoreOpen(o=>!o)}}><Icon name="dotsV" size={18}/></button>
          <Popover open={moreOpen} onClose={()=>setMoreOpen(false)} style={{top:36,right:0}}>
            <MenuItem onClick={()=>{expandAll();setMoreOpen(false)}}><Icon name="expand" size={16}/>Expand all</MenuItem>
            <MenuItem onClick={()=>{onUpdate(thread.id,{unread:true});setMoreOpen(false)}}><Icon name="mail" size={16}/>Mark unread</MenuItem>
            <MenuItem onClick={()=>setMoreOpen(false)}><Icon name="trash" size={16}/>Delete</MenuItem>
          </Popover>
        </div>
        <span className="tb-sep"/>
        <button className="ico-act" onClick={onToggleLead} data-active={leadOpen?'1':undefined}><Icon name="panel" size={18}/></button>
      </div>
    </div>
    <div ref={scrollRef} className="reader-scroll">
      <div className="reader-inner">
        <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:8}}>
          <button className="icon-btn" style={{width:30,height:30,marginTop:2}} onClick={()=>onUpdate(thread.id,{starred:!thread.starred})}>
            <Icon name={thread.starred?'starF':'star'} size={19} style={{color:thread.starred?'var(--accent-warm)':'var(--ink-3)'}}/></button>
          <h1 className="thread-subject" style={{fontSize:22,lineHeight:1.22,margin:0,flex:1}}>{thread.subject}</h1>
        </div>
        <div className="faint" style={{fontSize:12.5,marginBottom:18,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',paddingLeft:40}}>
          <IntentBadge intent={thread.intent}/>
          <span style={{display:'inline-flex',alignItems:'center',gap:6}}><Icon name="mail" size={13}/>{thread.messages.length} message{thread.messages.length!==1?'s':''}</span>
          <span>·</span><span style={{color:'var(--primary)',fontWeight:600}}>{thread.campaign}</span>
        </div>
        {collapsedCount>0&&<button onClick={expandAll} className="expand-strip"><Icon name="expand" size={15}/> Expand {collapsedCount} collapsed message{collapsedCount>1?'s':''}</button>}
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {thread.messages.map((m,i)=><Message key={i} m={m} leadName={thread.lead.name} isLast={i===thread.messages.length-1} open={expanded.has(i)} onToggle={()=>toggle(i)}/>)}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,margin:'20px 0 4px',flexWrap:'wrap'}}>
          <span className="kicker" style={{marginRight:2}}>Set intent</span>
          {intents.map(k=><button key={k} onClick={()=>onUpdate(thread.id,{intent:k,status:k})} style={{padding:0,border:'none',background:'none',cursor:'pointer',opacity:thread.intent===k?1:.4,transition:'.12s'}}><IntentBadge intent={k}/></button>)}
        </div>
      </div>
    </div>
    <Composer thread={thread} handler={handler} onSend={send}/>
  </div>
}
function LeadPanel({thread,handlers,onClose}){
  const h=thread.assignee?handlers.find(x=>x.id===thread.assignee):null
  const l=thread.lead
  const [copied,setCopied]=uS(false)
  function copy(){try{navigator.clipboard.writeText(l.email)}catch(e){}setCopied(true);setTimeout(()=>setCopied(false),1200)}
  return <aside className="lead-panel">
    <div style={{padding:'16px 20px',borderBottom:'1px solid var(--line)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <span className="kicker">Lead</span>
        <button className="icon-btn" onClick={onClose} style={{width:26,height:26}}><Icon name="x" size={15}/></button>
      </div>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <Avatar name={l.name} size="lg"/>
        <div style={{minWidth:0}}><div style={{fontWeight:700,fontSize:16,letterSpacing:'-.01em'}}>{l.name}</div><div className="faint" style={{fontSize:12.5}}>{l.title}</div></div>
      </div>
      <div style={{display:'flex',gap:7,marginTop:13,flexWrap:'wrap'}}>
        <IntentBadge intent={thread.intent}/>
        <span className={'badge '+(thread.sla==='breach'?'sla-breach':thread.sla==='risk'?'sla-risk':'sla-ok')}><Icon name="clock" size={12}/>SLA {thread.sla==='breach'?'breached':thread.sla==='risk'?'at risk':'on time'}</span>
      </div>
    </div>
    {l.linkedin&&l.linkedin!=='#'&&<div style={{padding:'16px 20px',borderBottom:'1px solid var(--line)'}}>
      <div className="kicker" style={{marginBottom:8}}>Job posting</div>
      <div style={{fontSize:13.5,fontWeight:600,lineHeight:1.4,marginBottom:11}}>{l.jobTitle}</div>
      <a href={l.linkedin} target="_blank" rel="noreferrer" className="btn primary block" style={{textDecoration:'none'}}><Icon name="linkedin" size={17}/> Open job on LinkedIn <Icon name="external" size={14}/></a>
    </div>}
    <div style={{padding:'18px 20px',display:'grid',gap:16}}>
      <div className="kicker">Lead details</div>
      <div>
        <div className="kicker" style={{marginBottom:4}}>Email</div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span className="mono" style={{fontSize:12.5,fontWeight:500,wordBreak:'break-word',flex:1}}>{l.email}</span>
          <button className="icon-btn" onClick={copy} style={{width:26,height:26}}><Icon name={copied?'check':'fileText'} size={14} style={copied?{color:'var(--green)'}:undefined}/></button>
        </div>
      </div>
      {l.company&&<div><div className="kicker" style={{marginBottom:4}}>Company</div><div style={{fontWeight:600,fontSize:13.5}}>{l.company}</div></div>}
      <div><div className="kicker" style={{marginBottom:6}}>Campaign</div><div style={{fontSize:13,fontWeight:600}}>{thread.campaign}</div></div>
      <div><div className="kicker" style={{marginBottom:6}}>Handler</div>{h?<div style={{display:'flex',alignItems:'center',gap:7,fontSize:13,fontWeight:600}}><Avatar name={h.name} color={h.color} size="xs"/>{h.name}</div>:<span className="faint" style={{fontSize:13}}>Unassigned</span>}</div>
    </div>
  </aside>
}

/* ============================================================
   INBOX SCREEN
   ============================================================ */
function ReplyRow({thread,active,selected,onOpen,onToggleSel,onUpdate}){
  const last=thread.messages[thread.messages.length-1]
  const preview=last.body.replace(/\n+/g,' ').slice(0,72)
  return <div className="reply-row" data-active={active?'1':undefined} data-unread={thread.unread&&!thread.done?'1':undefined} data-sel={selected?'1':undefined} data-done={thread.done?'1':undefined} onClick={onOpen}>
    <div className="row-ctrl">
      <Checkbox on={selected} onClick={onToggleSel}/>
      <button className="star-btn" onClick={e=>{e.stopPropagation();onUpdate(thread.id,{starred:!thread.starred})}}><Icon name={thread.starred?'starF':'star'} size={16} style={{color:thread.starred?'var(--accent-warm)':'var(--ink-4)'}}/></button>
    </div>
    <div className="row-av"><Avatar name={thread.lead.name} size="md"/></div>
    <div className="row-main">
      <div className="row-top">
        <span className="row-sender">{thread.lead.name}</span>
        <span className="faint" style={{fontSize:11.5,whiteSpace:'nowrap'}}>· {thread.lead.domain}</span>
        <span className="row-date">{thread.ts}</span>
        <div className="row-actions" onClick={e=>e.stopPropagation()}>
          <button className="ico-act sm" onClick={()=>onUpdate(thread.id,{done:true})}><Icon name="archive" size={16}/></button>
          <button className="ico-act sm" onClick={()=>onUpdate(thread.id,{done:!thread.done})}><Icon name="check" size={16}/></button>
        </div>
      </div>
      <div className="row-subj">{thread.subject}</div>
      <div className="row-bottom"><IntentBadge intent={thread.intent}/><span className="row-snip">{preview}…</span><span className="row-camp"><Dot color={colorFor(thread.campaign)} size={7}/>{thread.campaign.replace(/ —.*$/,'').slice(0,18)}</span></div>
    </div>
  </div>
}
function EmptyReader(){
  return <div className="reader" style={{display:'grid',placeItems:'center'}}>
    <div style={{textAlign:'center',color:'var(--ink-3)',maxWidth:300}}>
      <div style={{width:62,height:62,borderRadius:16,background:'var(--surface)',border:'1px solid var(--line)',display:'grid',placeItems:'center',margin:'0 auto 16px',color:'var(--ink-4)'}}><Icon name="mail" size={28}/></div>
      <div className="serif" style={{fontWeight:600,color:'var(--ink-2)',fontSize:18}}>Select a conversation</div>
      <p style={{fontSize:13,lineHeight:1.55,marginTop:6}}>Open any reply to read the full thread, lead details and the job link.</p>
    </div>
  </div>
}
function InboxScreen({threads,handler,isAdmin,onUpdate,filter,handlers}){
  const [sel,setSel]=uS(null)
  const [selected,setSelected]=uS(()=>new Set())
  const [sort,setSort]=uS('newest')
  const [stat,setStat]=uS('all')
  const [campF,setCampF]=uS('all')
  const [leadOpen,setLeadOpen]=uS(true)
  uE(()=>{setSelected(new Set());setSel(null)},[filter?.title])

  let list=threads.slice()
  if(stat==='new') list=list.filter(t=>t.unread&&!t.done)
  else if(stat==='unassigned') list=list.filter(t=>!t.assignee)
  else if(stat==='done') list=list.filter(t=>t.done)
  else if(stat==='starred') list=list.filter(t=>t.starred)
  else list=list.filter(t=>!t.done)
  if(campF!=='all') list=list.filter(t=>t.campaign===campF)
  if(filter?.campaign) list=list.filter(t=>t.campaign===filter.campaign)
  if(filter?.assignee) list=list.filter(t=>t.assignee===filter.assignee)
  if(sort==='oldest') list=list.slice().reverse()

  const selThread=sel?threads.find(t=>t.id===sel):null
  const camps=[...new Set(threads.map(t=>t.campaign))].filter(Boolean)
  const statusTabs=[
    {value:'all',label:'Open',count:threads.filter(t=>!t.done).length},
    {value:'new',label:'New',count:threads.filter(t=>t.unread&&!t.done).length},
    {value:'starred',label:'Starred',count:threads.filter(t=>t.starred).length},
    {value:'unassigned',label:'Unassigned',count:threads.filter(t=>!t.assignee).length},
    {value:'done',label:'Done',count:threads.filter(t=>t.done).length},
  ]
  function toggleSel(id){setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n})}
  function selAll(){setSelected(s=>s.size===list.length?new Set():new Set(list.map(t=>t.id)))}
  function bulk(patch){selected.forEach(id=>onUpdate(id,patch));setSelected(new Set())}
  const allSel=list.length>0&&selected.size===list.length
  const someSel=selected.size>0

  return <div style={{display:'flex',flex:1,minWidth:0,overflow:'hidden'}}>
    <div className="mailbox">
      <div className="mailbox-head">
        {someSel?<div className="bulk-bar">
          <Checkbox on={allSel} indeterminate={someSel} onClick={selAll}/>
          <span style={{fontWeight:600,fontSize:13}}>{selected.size} selected</span>
          <span className="tb-sep"/>
          <button className="ico-act sm" onClick={()=>bulk({done:true})}><Icon name="archive" size={17}/></button>
          <button className="ico-act sm" onClick={()=>bulk({done:true})}><Icon name="check" size={17}/></button>
          <button className="ico-act sm" onClick={()=>bulk({unread:false})}><Icon name="mail" size={17}/></button>
          <button className="btn ghost sm" style={{marginLeft:'auto'}} onClick={()=>setSelected(new Set())}>Clear</button>
        </div>:<div style={{display:'flex',alignItems:'center',gap:8,width:'100%'}}>
          <Checkbox on={false} onClick={selAll}/>
          <div style={{flex:1,minWidth:0}}><div className="serif" style={{fontWeight:600,fontSize:17,letterSpacing:'-.01em',lineHeight:1.1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{filter?.title||'Inbox'}</div></div>
          <div style={{flex:'none',display:'flex',alignItems:'center',gap:2}}>
            <span className="faint tnum" style={{fontSize:12,marginRight:6}}>{list.length} of {threads.length}</span>
            <button className="ico-act sm" onClick={()=>setSort(s=>s==='newest'?'oldest':'newest')}><Icon name="sort" size={16}/></button>
          </div>
        </div>}
      </div>
      {!someSel&&<div className="mailbox-filters">
        <div className="seg-scroll"><Seg size="sm" options={statusTabs} value={stat} onChange={setStat}/></div>
        {camps.length>1&&<div className="camp-chips">
          <button onClick={()=>setCampF('all')} className={'chip'+(campF==='all'?' on':'')} style={{height:25,fontSize:11.5}}>All</button>
          {camps.map(cid=><button key={cid} onClick={()=>setCampF(cid)} className={'chip'+(campF===cid?' on':'')} style={{height:25,fontSize:11.5}}><Dot color={colorFor(cid)} size={7}/>{cid.replace(/ —.*$/,'').slice(0,16)}</button>)}
        </div>}
      </div>}
      <div className="mailbox-list">
        {list.map(t=><ReplyRow key={t.id} thread={t} active={t.id===sel} selected={selected.has(t.id)}
          onOpen={()=>{setSel(t.id);if(t.unread)onUpdate(t.id,{unread:false})}}
          onToggleSel={()=>toggleSel(t.id)} onUpdate={onUpdate}/>)}
        {list.length===0&&<div style={{padding:'52px 24px',textAlign:'center',color:'var(--ink-3)'}}><Icon name="inbox" size={30} style={{margin:'0 auto 10px'}}/><div style={{fontSize:13}}>Nothing here.</div></div>}
      </div>
    </div>
    {selThread?<>
      <ThreadReader thread={selThread} handler={handler} isAdmin={isAdmin} onUpdate={onUpdate} onClose={()=>setSel(null)} handlers={handlers} leadOpen={leadOpen} onToggleLead={()=>setLeadOpen(o=>!o)}/>
      {leadOpen&&<LeadPanel thread={selThread} handlers={handlers} onClose={()=>setLeadOpen(false)}/>}
    </>:<EmptyReader/>}
  </div>
}

/* ============================================================
   CAMPAIGNS SCREEN
   ============================================================ */
function CampaignsScreen({threads,isAdmin,campaigns,onOpenInbox}){
  const byCamp=campaigns.map(name=>{
    const t=threads.filter(x=>x.campaign===name)
    return {name,replies:t.length,neu:t.filter(x=>x.unread&&!x.done).length,interested:t.filter(x=>x.intent==='interested').length,meetings:t.filter(x=>x.intent==='meeting').length,done:t.filter(x=>x.done).length}
  })
  return <div className="content"><div className="page">
    <div className="page-head">
      <div><div className="page-title">Campaigns</div><div className="page-sub">{campaigns.length} active · {threads.length} replies routed</div></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
      {byCamp.map(c=>{
        const pct=c.replies?Math.round(c.done/c.replies*100):0
        return <div key={c.name} className="card" style={{padding:18,display:'flex',flexDirection:'column'}}>
          <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:16}}>
            <Dot color={colorFor(c.name)} size={9}/>
            <span style={{fontWeight:700,fontSize:14,flex:1,minWidth:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:18}}>
            <Donut pct={pct} size={78} stroke={8} color={colorFor(c.name)}>
              <div style={{textAlign:'center'}}><div className="tnum" style={{fontWeight:800,fontSize:16}}>{pct}%</div><div className="kicker" style={{fontSize:8.5}}>handled</div></div>
            </Donut>
            <div style={{flex:1,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
              {[['new',c.neu,'var(--ink)'],['interested',c.interested,'var(--green)'],['meetings',c.meetings,'var(--ink)']].map(s=><div key={s[0]}><div className="tnum" style={{fontWeight:800,fontSize:21,color:s[2]}}>{s[1]}</div><div className="faint" style={{fontSize:10.5,lineHeight:1.2,marginTop:2}}>{s[0]}</div></div>)}
            </div>
          </div>
          <hr className="divider" style={{margin:'16px 0 13px'}}/>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button className="btn sm" onClick={()=>onOpenInbox(c.name)}>View inbox</button>
          </div>
        </div>
      })}
    </div>
  </div></div>
}

/* ============================================================
   ADMIN SCREEN
   ============================================================ */
function AdminScreen({threads,handlers,campaigns}){
  const [tab,setTab]=uS('assign')
  return <div className="content"><div className="page">
    <div className="page-head">
      <div><div className="page-title">Admin panel</div><div className="page-sub">Manage handlers and campaign assignments</div></div>
    </div>
    <div style={{display:'flex',gap:4,borderBottom:'1px solid var(--line)',marginBottom:24}}>
      {[['assign','Campaign assignments'],['handlers','Handlers & access']].map(t=><button key={t[0]} onClick={()=>setTab(t[0])} style={{position:'relative',padding:'10px 4px',marginRight:18,border:'none',background:'none',fontWeight:600,fontSize:14,color:tab===t[0]?'var(--ink)':'var(--ink-3)'}}>
        {t[1]}{tab===t[0]&&<span style={{position:'absolute',left:0,right:0,bottom:-1,height:2,background:'var(--primary)',borderRadius:2}}/>}
      </button>)}
    </div>
    {tab==='assign'?<div className="card" style={{overflow:'hidden'}}>
      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 80px',gap:14,padding:'12px 20px',borderBottom:'1px solid var(--line)',background:'var(--surface-2)'}}>
        <div className="kicker">Campaign</div><div className="kicker">Replies</div><div className="kicker">Action</div>
      </div>
      {campaigns.map((name,i)=>{
        const t=threads.filter(x=>x.campaign===name)
        return <div key={name} style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 80px',gap:14,padding:'15px 20px',alignItems:'center',borderBottom:i<campaigns.length-1?'1px solid var(--line-2)':'none'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}><Dot color={colorFor(name)} size={9}/><span style={{fontWeight:600,fontSize:13.5}}>{name}</span></div>
          <div className="faint" style={{fontSize:13}}>{t.length} replies · {t.filter(x=>x.unread&&!x.done).length} new</div>
          <button className="btn sm">View</button>
        </div>
      })}
    </div>:<div style={{display:'grid',gap:12}}>
      {handlers.map(h=>{
        const assigned=threads.filter(t=>t.assignee===h.id).length
        return <div key={h.id} className="card" style={{padding:'16px 18px',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
          <Avatar name={h.name} color={h.color} size="lg"/>
          <div style={{flex:1,minWidth:200}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontWeight:700,fontSize:15}}>{h.name}</span><span className={'badge '+(h.role==='admin'?'solid':'ghost')} style={{height:19,fontSize:10.5}}>{h.role==='admin'?'Admin':'Handler'}</span></div>
            <div className="mono faint" style={{fontSize:11.5,marginTop:3}}>{h.email} · {assigned} assigned replies</div>
          </div>
          <button className="btn sm"><Icon name="lock" size={14}/> Reset PIN</button>
        </div>
      })}
    </div>}
  </div></div>
}

/* ============================================================
   ANALYTICS + TEAM SCREENS
   ============================================================ */
function AnalyticsScreen({threads,handlers}){
  const total=threads.length
  const interested=threads.filter(t=>t.intent==='interested').length
  const meetings=threads.filter(t=>t.intent==='meeting').length
  const open=threads.filter(t=>!t.done).length
  const intents=[
    {key:'interested',label:'Interested',color:'var(--green)'},
    {key:'meeting',label:'Meeting',color:'var(--violet)'},
    {key:'new',label:'New',color:'var(--blue)'},
    {key:'ooo',label:'OOO',color:'var(--amber)'},
    {key:'unsubscribe',label:'Unsub',color:'var(--red)'},
  ]
  const intentMax=Math.max(...intents.map(i=>threads.filter(t=>t.intent===i.key).length),1)
  const leaderboard=handlers.map(h=>({h,replies:threads.filter(t=>t.assignee===h.id).length})).sort((a,b)=>b.replies-a.replies)
  const maxLead=Math.max(...leaderboard.map(l=>l.replies),1)
  const camps=[...new Set(threads.map(t=>t.campaign))].filter(Boolean)
  const campMax=Math.max(...camps.map(c=>threads.filter(t=>t.campaign===c).length),1)
  return <div className="content"><div className="page" style={{maxWidth:1180}}>
    <div className="page-head"><div><div className="page-title">Analytics</div><div className="page-sub">{total} total replies</div></div></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:16}}>
      <Stat label="Total replies" value={total} sub="all time"/>
      <Stat label="Interested" value={interested} sub={total?`${Math.round(interested/total*100)}% of replies`:''} accent="var(--green)"/>
      <Stat label="Open" value={open} sub="needs response" accent="var(--primary)"/>
      <Stat label="Meetings" value={meetings} sub="booked from replies"/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
      <div className="card panel-pad">
        <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>Intent breakdown</div>
        <div style={{display:'grid',gap:11}}>
          {intents.map(it=>{const n=threads.filter(t=>t.intent===it.key).length;return <div key={it.key} style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{display:'flex',alignItems:'center',gap:7,width:96,fontSize:12.5,fontWeight:500}}><Dot color={it.color}/>{it.label}</span>
            <div style={{flex:1}}><MeterBar value={n} max={intentMax} color={it.color} h={6}/></div>
            <span className="tnum faint" style={{fontSize:12,width:20,textAlign:'right'}}>{n}</span>
          </div>})}
        </div>
      </div>
      <div className="card panel-pad">
        <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>Team leaderboard</div>
        <div style={{display:'grid',gap:12}}>
          {leaderboard.map((l,i)=><div key={l.h.id} style={{display:'flex',alignItems:'center',gap:11}}>
            <span className="tnum faint" style={{width:12,fontWeight:700,fontSize:13}}>{i+1}</span>
            <Avatar name={l.h.name} color={l.h.color} size="sm"/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{fontWeight:600,fontSize:13}}>{l.h.name}</span><span className="tnum faint" style={{fontSize:12}}>{l.replies}</span></div>
              <MeterBar value={l.replies} max={maxLead} color={l.h.color} h={5}/>
            </div>
          </div>)}
        </div>
      </div>
      <div className="card panel-pad">
        <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>By campaign</div>
        <div style={{display:'grid',gap:12}}>
          {camps.map(c=>{const n=threads.filter(t=>t.campaign===c).length;return <div key={c} style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{display:'flex',alignItems:'center',gap:7,flex:1,minWidth:0,fontSize:12.5}}><Dot color={colorFor(c)}/><span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.replace(/ —.*$/,'')}</span></span>
            <div style={{width:64}}><MeterBar value={n} max={campMax} color={colorFor(c)} h={6}/></div>
            <span className="tnum faint" style={{fontSize:12,width:18,textAlign:'right'}}>{n}</span>
          </div>})}
        </div>
      </div>
    </div>
  </div></div>
}
function TeamScreen({threads,handlers,onGoInbox}){
  const open=threads.filter(t=>!t.done).length
  const awaiting=threads.filter(t=>t.unread&&!t.done).length
  const interested=threads.filter(t=>t.intent==='interested').length
  const meetings=threads.filter(t=>t.intent==='meeting').length
  const maxLoad=Math.max(...handlers.map(h=>threads.filter(t=>t.assignee===h.id).length),1)
  return <div className="content"><div className="page" style={{maxWidth:1180}}>
    <div className="page-head"><div><div className="page-title">Team overview</div><div className="page-sub">{open} open · <span style={{color:'var(--primary)',fontWeight:600}}>{awaiting} new</span></div></div></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:16}}>
      <Stat label="Awaiting reply" value={awaiting} accent="var(--primary)"/>
      <Stat label="Interested" value={interested} accent="var(--green)"/>
      <Stat label="Open" value={open}/>
      <Stat label="Meetings" value={meetings}/>
    </div>
    <div className="card panel-pad">
      <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Workload</div>
      <div style={{display:'grid',gap:14}}>
        {handlers.map(h=>{
          const t=threads.filter(x=>x.assignee===h.id)
          const L={total:t.length,neu:t.filter(x=>x.unread&&!x.done).length,interested:t.filter(x=>x.intent==='interested').length,meetings:t.filter(x=>x.intent==='meeting').length}
          return <div key={h.id} onClick={()=>onGoInbox(h.id)} style={{display:'flex',gap:13,alignItems:'center',cursor:'pointer',padding:'4px 6px',borderRadius:10,transition:'.1s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <Avatar name={h.name} color={h.color} size="md"/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}><span style={{fontWeight:600,fontSize:14}}>{h.name}</span><span className="tnum" style={{fontWeight:800,fontSize:18}}>{L.total}</span></div>
              <div className="faint" style={{fontSize:11.5,margin:'2px 0 7px'}}><span style={{color:L.neu?'var(--primary)':'inherit',fontWeight:L.neu?600:400}}>{L.neu} new</span> · {L.interested} interested · {L.meetings} meetings</div>
              <MeterBar value={L.total} max={maxLoad} color={h.color} h={6}/>
            </div>
          </div>
        })}
      </div>
    </div>
  </div></div>
}

/* ============================================================
   SIDEBAR
   ============================================================ */
const ACCENTS={
  '#0E6B66':{name:'Teal',strong:'#0A4F4B',ink:'#0B4642',tint:'#E1EFED',tint2:'#EFF6F4'},
  '#2E6B45':{name:'Pine',strong:'#1F4E31',ink:'#1E4A2F',tint:'#E5EFE8',tint2:'#F1F6F2'},
  '#2B2E2A':{name:'Graphite',strong:'#16191A',ink:'#26302A',tint:'#E8E9E4',tint2:'#F2F3EE'},
  '#8A3A3A':{name:'Oxblood',strong:'#6E2C2C',ink:'#6B2B2B',tint:'#F2E3E1',tint2:'#F9F0EE'},
  '#8A6420':{name:'Amber',strong:'#6F4E15',ink:'#684915',tint:'#F1E8D5',tint2:'#F8F3E8'},
}
function applyTheme(accent){
  const a=ACCENTS[accent]||ACCENTS['#0E6B66']
  const r=document.documentElement.style
  r.setProperty('--primary',accent);r.setProperty('--primary-strong',a.strong)
  r.setProperty('--primary-ink',a.ink);r.setProperty('--primary-tint',a.tint)
  r.setProperty('--primary-tint-2',a.tint2)
}
function Sidebar({handler,isAdmin,route,setRoute,campaigns,handlers,go,onLogout,accent,setAccent,density,setDensity}){
  const [menu,setMenu]=uS(false)
  const [settingsOpen,setSettingsOpen]=uS(false)
  const nav=isAdmin
    ?[['inbox','Inbox','inbox'],['mine','My replies','user'],['team','Team','users'],['campaigns','Campaigns','campaign'],['admin','Admin panel','shield'],['analytics','Analytics','chart']]
    :[['inbox','Inbox','inbox'],['mine','My replies','user'],['campaigns','Campaigns','campaign']]
  return <div className="sidebar">
    <div className="sb-brand">
      <div className="brand-mark" style={{width:31,height:31,fontSize:18,borderRadius:8}}>R</div><span className="brand-name">Replyloop</span>
      {isAdmin&&<span className="badge solid" style={{height:18,fontSize:9.5,marginLeft:'auto'}}>ADMIN</span>}
    </div>
    <div className="sb-scroll">
      <div className="sb-search"><Icon name="search" size={15}/> Search replies…</div>
      {nav.map(([key,label,ic])=><div key={key} className={'nav-item'+(route===key?' active':'')} onClick={()=>setRoute(key)}>
        <Icon name={ic} size={18} className="nav-ic"/>
        <span className="nav-label">{label}</span>
      </div>)}
      <div className="sb-group-label">Campaigns</div>
      {campaigns.map(name=><div key={name} className="nav-item" onClick={()=>go({route:'inbox',campaign:name,title:name})}>
        <span className="nav-dot" style={{background:colorFor(name)}}/><span className="nav-label">{name}</span>
      </div>)}
      {isAdmin&&handlers.length>0&&<>
        <div className="sb-group-label">Handlers</div>
        {handlers.filter(h=>h.role!=='admin').map(h=><div key={h.id} className="nav-item" onClick={()=>go({route:'inbox',assignee:h.id,title:h.name+' · replies'})}>
          <Avatar name={h.name} color={h.color} size="xs"/><span className="nav-label" style={{marginLeft:2}}>{h.name}</span>
        </div>)}
      </>}
    </div>
    <div className="sb-foot">
      <Avatar name={handler.name} color={handler.color} size="md"/>
      <div className="uf"><div className="uf-name">{handler.name}</div><div className="uf-role">{isAdmin?'Admin':'Handler'}</div></div>
      <div style={{position:'relative'}}>
        <button className="icon-btn" onClick={e=>{e.stopPropagation();setMenu(m=>!m)}}><Icon name="more" size={18}/></button>
        <Popover open={menu} onClose={()=>setMenu(false)} style={{bottom:38,right:0,minWidth:170}}>
          <div style={{padding:'7px 10px 4px'}}><div style={{fontWeight:600,fontSize:13}}>{handler.name}</div><div className="mono faint" style={{fontSize:11}}>{handler.email}</div></div>
          <hr className="divider" style={{margin:'5px 6px'}}/>
          <MenuItem onClick={()=>{setMenu(false);setSettingsOpen(true)}}><Icon name="more" size={16}/> Preferences</MenuItem>
          <MenuItem onClick={onLogout}><Icon name="logout" size={16}/> Sign out</MenuItem>
        </Popover>
      </div>
    </div>
    {settingsOpen&&<div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(26,28,24,.4)',backdropFilter:'blur(2px)',display:'grid',placeItems:'center'}} onClick={()=>setSettingsOpen(false)}>
      <div className="card" style={{width:320,padding:'20px 22px',boxShadow:'var(--sh-pop)'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <span className="serif" style={{fontWeight:600,fontSize:17}}>Preferences</span>
          <button className="icon-btn" onClick={()=>setSettingsOpen(false)}><Icon name="x" size={16}/></button>
        </div>
        <div className="kicker" style={{marginBottom:10}}>Accent color</div>
        <div style={{display:'flex',gap:8,marginBottom:18}}>
          {Object.entries(ACCENTS).map(([hex])=><button key={hex} onClick={()=>setAccent(hex)} style={{width:32,height:32,borderRadius:'50%',background:hex,border:accent===hex?'3px solid var(--ink)':'3px solid transparent',transition:'.12s'}}/>)}
        </div>
        <div className="kicker" style={{marginBottom:10}}>Density</div>
        <Seg options={['compact','regular','comfy']} value={density} onChange={setDensity}/>
        <button className="btn primary block" style={{marginTop:20}} onClick={()=>setSettingsOpen(false)}>Done</button>
      </div>
    </div>}
  </div>
}

/* ============================================================
   APP ROOT
   ============================================================ */
export default function App(){
  const [session,setSessionState]=uS(()=>{
    try{
      const params=new URLSearchParams(window.location.search);
      const token=params.get('s')||params.get('session');
      if(token){
        const s=JSON.parse(decodeURIComponent(escape(atob(token))));
        setSession(s);
        window.history.replaceState({},'',window.location.pathname);
        return s;
      }
    }catch(e){}
    return getSession();
  })
  const [route,setRoute]=uS('inbox')
  const [filter,setFilter]=uS(null)
  const [threads,setThreads]=uS([])
  const [handlers,setHandlers]=uS([])
  const [campaigns,setCampaigns]=uS([])
  const [loading,setLoading]=uS(true)
  const [accent,setAccentState]=uS('#0E6B66')
  const [density,setDensityState]=uS('regular')

  function setAccent(a){setAccentState(a);applyTheme(a)}
  function setDensity(d){
    setDensityState(d)
    document.body.classList.remove('compact','comfy')
    if(d==='compact')document.body.classList.add('compact')
    if(d==='comfy')document.body.classList.add('comfy')
  }

  // Load handlers from poc_profiles
  uE(()=>{
    if(!session) return
    supabase.from('poc_profiles').select('*').then(({data})=>{
      if(data) setHandlers(data.map(p=>({
        id: p.name,
        name: p.name,
        email: p.email,
        role: p.role,
        color: p.color||colorFor(p.name),
      })))
    })
  },[session])

  // Load replies from instantly_replies
  uE(()=>{
    if(!session) return
    setLoading(true)
    supabase.from('instantly_replies').select('*').order('created_at',{ascending:false}).limit(500)
      .then(({data,error})=>{
        if(data){
          const mapped=data.map(rowToThread)
          setThreads(mapped)
          const campNames=[...new Set(mapped.map(t=>t.campaign).filter(Boolean))]
          setCampaigns(campNames)
        }
        setLoading(false)
      })
  },[session])

  // Realtime subscription
  uE(()=>{
    if(!session) return
    const sub=supabase.channel('replies-rt')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'instantly_replies'},payload=>{
        const t=rowToThread(payload.new)
        setThreads(prev=>[t,...prev])
        setCampaigns(prev=>[...new Set([...prev,t.campaign].filter(Boolean))])
      })
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'instantly_replies'},payload=>{
        setThreads(prev=>prev.map(t=>t.id===payload.new.id?{...t,...rowToThread(payload.new)}:t))
      })
      .subscribe()
    return ()=>supabase.removeChannel(sub)
  },[session])

  const adminUser=session&&isAdmin(session)
  const handler=session?{id:session.id||session.name,name:session.name,email:session.email,role:session.role,color:session.color||colorFor(session.name),is_admin:adminUser}:null

  // Scope threads to handler's campaigns if not admin
  const scoped=uM(()=>{
    if(!handler) return []
    if(adminUser) return threads
    return threads.filter(t=>t.assignee===handler.name||t.assignee===handler.id)
  },[threads,handler,adminUser])

  async function onUpdate(id,patch){
    setThreads(ts=>ts.map(x=>x.id===id?{...x,...patch}:x))
    // Map UI fields back to DB columns
    const dbPatch={}
    if('done' in patch) dbPatch.status=patch.done?'Archive':(patch.status||'New')
    if('intent' in patch) dbPatch.status=patch.intent.charAt(0).toUpperCase()+patch.intent.slice(1)
    if('poc' in patch) dbPatch.poc=patch.poc
    if('assignee' in patch&&!('poc' in patch)) dbPatch.poc=patch.assignee
    if('unread' in patch&&!patch.unread) dbPatch.status=dbPatch.status||'New'
    if(Object.keys(dbPatch).length){
      await supabase.from('instantly_replies').update(dbPatch).eq('id',id)
    }
  }

  function go(o){setRoute(o.route||'inbox');setFilter(o)}
  function setRouteClean(r){setRoute(r);setFilter(null)}

  function handleLogout(){clearSession();setSessionState(null);setThreads([]);setHandlers([])}
  function handleLogin(sess){setSession(sess);setSessionState(sess)}

  if(!session){window.location.href='https://consultadd-site-production.up.railway.app';return null;}

  if(loading) return <div style={{height:'100%',display:'grid',placeItems:'center',background:'var(--canvas)'}}>
    <div style={{textAlign:'center',color:'var(--ink-3)'}}>
      <div style={{width:40,height:40,border:'3px solid var(--line)',borderTopColor:'var(--primary)',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 16px'}}/>
      <div style={{fontSize:14}}>Loading replies…</div>
    </div>
  </div>

  let viewThreads=scoped,title=null
  if(route==='mine'){viewThreads=scoped.filter(x=>x.assignee===handler.id||x.assignee===handler.name);title='My replies'}
  if(route==='inbox'&&filter){
    if(filter.assignee) viewThreads=scoped.filter(x=>x.assignee===filter.assignee)
    if(filter.campaign) viewThreads=scoped.filter(x=>x.campaign===filter.campaign)
    title=filter.title
  }

  return <div className="app">
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <Sidebar handler={handler} isAdmin={adminUser} route={route} setRoute={setRouteClean}
      campaigns={campaigns} handlers={handlers} go={go} onLogout={handleLogout}
      accent={accent} setAccent={setAccent} density={density} setDensity={setDensity}/>
    <div className="main">
      {(route==='inbox'||route==='mine')&&
        <InboxScreen key={route+'-'+(filter?.campaign||filter?.assignee||filter?.title||'')}
          threads={viewThreads} handler={handler} isAdmin={adminUser} onUpdate={onUpdate}
          filter={{...(filter||{}),title}} handlers={handlers}/>}
      {route==='campaigns'&&<CampaignsScreen threads={scoped} isAdmin={adminUser} campaigns={campaigns} onOpenInbox={name=>go({route:'inbox',campaign:name,title:name})}/>}
      {route==='admin'&&adminUser&&<AdminScreen threads={threads} handlers={handlers} campaigns={campaigns}/>}
      {route==='analytics'&&adminUser&&<AnalyticsScreen threads={threads} handlers={handlers}/>}
      {route==='team'&&adminUser&&<TeamScreen threads={threads} handlers={handlers} onGoInbox={hid=>go({route:'inbox',assignee:hid,title:(handlers.find(h=>h.id===hid)?.name||hid)+' · replies'})}/>}
    </div>
  </div>
}
