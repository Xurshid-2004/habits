"use client";
import { useEffect, useState, useCallback, useRef } from 'react';
import CalendarNavbar from "../calendar";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Check, Clock, CheckCircle2, X, FileText, Sparkles, Sunrise, Sunset } from 'lucide-react';
import { formatDateKey, getHabitLogsByDate, getSelectedHabitIds, setHabitStatus, type HabitStatus } from '@/lib/habitStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Drawer } from 'vaul';
import AIHealthCoach from '@/app/dashboard/AIHealthCoach';

type DbHabit = { id:number; title?:string|null; name?:string|null; icon_url:string; description:string; target_days:number; created_at:string; };
type ProfileTimes = { startTime:string|null; endTime:string|null; };

const STATIC_HABITS = [
  {key:'static-erta-turish',title:'Erta turish',image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4CQ7lTP6GADtwaRSzLmXVKjaHVTaCp0u8IA&s',description:'Har kuni erta turish odati - salomatlik va unumdorlik uchun muhim.'},
  {key:'static-reja-tuzish',title:'Reja tuzish',image:'https://idum.uz/wp-content/uploads/2015/05/dokument_600.jpg',description:'Kunlik va haftalik rejalar tuzish - maqsadlarga erishishda yordam beradi.'},
  {key:'static-moliyaviy-nazorat',title:'Moliyaviy nazorat',image:'https://podrobno.uz/upload/iblock/983/1p4mf0astuk20fkqukhxcfj7ahjmakux/654654644745.jpg',description:'Moliyaviy xarajatlarni kuzatib borish va tejamkorlik odatini shakllantirish.'},
  {key:'static-drink-water',title:'Drink Water',image:'https://tdsrx.com/cdn/shop/articles/water.webp?v=1746550925',description:"Kuniga kamida 8 stakan suv ichish - sog'lom turmush tarzi uchun zarur."},
  {key:'static-read-book',title:'Read book',image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwksRMbg8-t7lCathIkt_WxysyC_cvkpC4vg&s',description:"Har kuni kitob o'qish - bilim va tafakkurni kengaytiradi."},
  {key:'static-coding',title:'Coding',image:'https://miro.medium.com/v2/resize:fit:1400/0*7VyEZgzwUhQMeBqb',description:"Dasturlash ko'nikmalarini oshirish uchun har kuni kod yozish."},
  {key:'static-workout',title:'Workout',image:'https://i.ytimg.com/vi/fYzBmBScl1I/maxresdefault.jpg',description:"Jismoniy mashqlar bilan shug'ullanish - kuch va chidamlilikni oshiradi."},
  {key:'static-stress',title:'Stressni boshqarish',image:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=80',description:'Meditatsiya va nafas mashqlari orqali stressni boshqarish.'},
  {key:'static-detoks',title:'Raqamli detoks',image:'https://www.afisha.uz/uploads/media/2025/12/2174a184ec82fb10e6caeb8f1f04ac04_lf.webp',description:'Ijtimoiy tarmoqlar va ekranlardan vaqtincha uzoqlashish.'},
  {key:'static-piyoda',title:'Har kunlik piyoda yurish',image:'https://xabar.uz/static/crop/1/7/920__95_1783015654.jpeg',description:'Har kuni kamida 30 daqiqa piyoda yurish - yurak va salomatlik uchun foydali.'},
] as const;

const LS_STATIC_KEY='selected_static_habit_keys_v1';
function readLocalStaticKeys():string[]{try{const raw=localStorage.getItem(LS_STATIC_KEY);const p=raw?(JSON.parse(raw) as unknown[]):[];return Array.isArray(p)?p.map(String):[];}catch{return[];}}
function readLocalNumericIds():string[]{try{const raw=localStorage.getItem('selected_habit_ids_v1');const p=raw?(JSON.parse(raw) as unknown[]):[];return Array.isArray(p)?p.map(String).filter((s)=>/^\d+$/.test(s)):[];}catch{return[];}}
function staticStatusKey(key:string,dateKey:string){return`habit_status:${key}:${dateKey}`;}
function readStaticStatus(key:string,dateKey:string):HabitStatus{try{const raw=localStorage.getItem(staticStatusKey(key,dateKey));if(raw==='success'||raw==='in_progress'||raw==='not_done')return raw;return'not_done';}catch{return'not_done';}}
function writeStaticStatus(key:string,dateKey:string,status:HabitStatus){try{localStorage.setItem(staticStatusKey(key,dateKey),status);}catch{}}
function minutesToTime(min:number):string{const h=Math.floor(min/60)%24;const m=min%60;return`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;}

type Toast={id:string;habitName:string;status:'in_progress'|'success'};
type DisplayHabit={uid:string;name:string;image:string;description:string;isStatic:boolean;dbId?:number;};
const VisuallyHidden=({children}:{children:React.ReactNode})=><span className="sr-only">{children}</span>;

function ProfileTimesCard({times}:{times:ProfileTimes}){
  if(!times.startTime&&!times.endTime)return null;
  return(
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
      className="mt-4 bg-gradient-to-r from-blue-950/50 via-zinc-900 to-amber-950/30 border border-blue-500/20 rounded-2xl px-4 py-3 flex items-center gap-4">
      {times.startTime&&(<div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/25 flex items-center justify-center"><Sunrise size={14} className="text-amber-400"/></div><div><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Tongni boshlaysi</p><p className="text-sm font-black text-amber-300">{times.startTime}</p></div></div>)}
      {times.startTime&&times.endTime&&<div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 via-zinc-700 to-blue-500/20"/>}
      {times.endTime&&(<div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-400/25 flex items-center justify-center"><Sunset size={14} className="text-blue-400"/></div><div><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Tugatasiz</p><p className="text-sm font-black text-blue-300">{times.endTime}</p></div></div>)}
    </motion.div>
  );
}

const Dashboard=()=>{
  const{user}=useAuth();
  const[dbHabits,setDbHabits]=useState<DbHabit[]>([]);
  const[loadingHabits,setLoadingHabits]=useState(true);
  const[selectedDate,setSelectedDate]=useState<Date>(()=>{const d=new Date();d.setHours(0,0,0,0);return d;});
  const[selectedNumericIds,setSelectedNumericIds]=useState<string[]>([]);
  const[selectedStaticKeys,setSelectedStaticKeys]=useState<string[]>([]);
  const[hiddenUids,setHiddenUids]=useState<string[]>([]);
  const[dbStatusMap,setDbStatusMap]=useState<Record<number,HabitStatus>>({});
  const[staticStatusMap,setStaticStatusMap]=useState<Record<string,HabitStatus>>({});
  const[savingUid,setSavingUid]=useState<string|null>(null);
  const[toasts,setToasts]=useState<Toast[]>([]);
  const toastTimers=useRef<Record<string,ReturnType<typeof setTimeout>>>({});
  const[profileTimes,setProfileTimes]=useState<ProfileTimes>({startTime:null,endTime:null});
  const[aiOpen,setAiOpen]=useState(false);
  const[descHabit,setDescHabit]=useState<DisplayHabit|null>(null);
  const[descOpen,setDescOpen]=useState(false);
  const dateKey=formatDateKey(selectedDate);

  const addToast=useCallback((habitName:string,status:'in_progress'|'success')=>{
    const id=`${Date.now()}-${Math.random()}`;
    setToasts((prev)=>[...prev.slice(-2),{id,habitName,status}]);
    toastTimers.current[id]=setTimeout(()=>{setToasts((prev)=>prev.filter((t)=>t.id!==id));delete toastTimers.current[id];},3500);
  },[]);

  useEffect(()=>()=>{Object.values(toastTimers.current).forEach(clearTimeout);},[]);

  useEffect(()=>{
    const f=async()=>{
      try{const{data,error}=await supabase.from('habits').select('*').order('created_at',{ascending:false});if(error)throw error;
        const n=((data??[]) as any[]).map((row)=>({...row,id:Number(String(row?.id))})).filter((row)=>Number.isFinite(row.id)) as DbHabit[];
        setDbHabits(n.filter((h)=>!String(h.name??'').startsWith('static-')));
      }catch(err){console.error(err);}finally{setLoadingHabits(false);}
    };void f();
  },[]);

  useEffect(()=>{
    const load=async()=>{if(!user?.id)return;try{const{data}=await supabase.from('profiles').select('start_day,end_day').eq('id',user.id).maybeSingle();
      if(data){const row=data as{start_day:number|null;end_day:number|null};setProfileTimes({startTime:row.start_day!=null?minutesToTime(Number(row.start_day)):null,endTime:row.end_day!=null?minutesToTime(Number(row.end_day)):null});}}catch{}};
    void load();
  },[user?.id]);

  useEffect(()=>{
    let cancelled=false;
    const sync=async()=>{
      if(!cancelled)setSelectedStaticKeys(readLocalStaticKeys());
      const localIds=readLocalNumericIds();if(!cancelled&&localIds.length>0)setSelectedNumericIds(localIds);
      if(user?.id){const remote=await getSelectedHabitIds(user.id);if(!cancelled&&remote.length>0)setSelectedNumericIds(remote.map(String));}
    };
    const onStorage=(e:StorageEvent)=>{if(e.key==='selected_habit_ids_v1')setSelectedNumericIds(readLocalNumericIds());if(e.key===LS_STATIC_KEY)setSelectedStaticKeys(readLocalStaticKeys());};
    window.addEventListener('storage',onStorage);void sync();
    return()=>{cancelled=true;window.removeEventListener('storage',onStorage);};
  },[user?.id]);

  useEffect(()=>{
    const key=`dashboard_hidden_uids_v1:${user?.id??'anon'}`;
    try{const raw=localStorage.getItem(key);const p=raw?(JSON.parse(raw) as unknown[]):[];setHiddenUids(Array.isArray(p)?p.map(String):[]);}catch{setHiddenUids([]);}
  },[user?.id]);

  useEffect(()=>{
    const key=`dashboard_hidden_uids_v1:${user?.id??'anon'}`;
    try{localStorage.setItem(key,JSON.stringify(hiddenUids));}catch{}
  },[hiddenUids,user?.id]);

  useEffect(()=>{if(!user?.id)return;void getHabitLogsByDate(user.id,dateKey).then(setDbStatusMap);},[dateKey,user?.id]);
  useEffect(()=>{const map:Record<string,HabitStatus>={};for(const h of STATIC_HABITS){map[h.key]=readStaticStatus(h.key,dateKey);}setStaticStatusMap(map);},[dateKey]);

  const selectedHabits:DisplayHabit[]=[
    ...dbHabits.filter((h)=>selectedNumericIds.includes(String(h.id))).map((h):DisplayHabit=>({uid:String(h.id),name:h.title||h.name||'Nomsiz odat',image:h.icon_url||'https://via.placeholder.com/300',description:h.description||'-',isStatic:false,dbId:h.id})),
    ...STATIC_HABITS.filter((h)=>selectedStaticKeys.includes(h.key)).map((h):DisplayHabit=>({uid:h.key,name:h.title,image:h.image,description:h.description,isStatic:true})),
  ].filter((h)=>!hiddenUids.includes(h.uid));

  const getStatus=(habit:DisplayHabit):HabitStatus=>habit.isStatic?(staticStatusMap[habit.uid]??'not_done'):(dbStatusMap[habit.dbId!]??'not_done');

  const handleSetStatus=async(habit:DisplayHabit,newStatus:HabitStatus)=>{
    if(savingUid===habit.uid)return;
    const prev=getStatus(habit);const status:HabitStatus=prev===newStatus?'not_done':newStatus;
    setSavingUid(habit.uid);
    if(habit.isStatic){setStaticStatusMap((m)=>({...m,[habit.uid]:status}));writeStaticStatus(habit.uid,dateKey,status);if(status!=='not_done')addToast(habit.name,status as 'in_progress'|'success');setSavingUid(null);}
    else{setDbStatusMap((m)=>({...m,[habit.dbId!]:status}));if(status!=='not_done')addToast(habit.name,status as 'in_progress'|'success');if(user?.id)await setHabitStatus(user.id,habit.dbId!,dateKey,status);setSavingUid((cur)=>(cur===habit.uid?null:cur));}
  };

  const successCount=selectedHabits.filter((h)=>getStatus(h)==='success').length;
  const inProgressCount=selectedHabits.filter((h)=>getStatus(h)==='in_progress').length;
  const progressPercent=selectedHabits.length>0?Math.round((successCount/selectedHabits.length)*100):0;

  return(
    <div className="min-h-screen bg-black text-white p-4 md:p-8 relative">
      <CalendarNavbar value={selectedDate} onChange={setSelectedDate}/>
      <ProfileTimesCard times={profileTimes}/>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Mening odatlarim</h2>
          <p className="text-zinc-500 text-sm mt-1">Tanlangan odatlarni shu kunda bajarilganini belgilang.</p>
        </div>
        <motion.button whileTap={{scale:0.93}} onClick={()=>setAiOpen((v)=>!v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all shadow-lg ${aiOpen?'bg-emerald-500/25 border-emerald-400/50 text-emerald-200':'bg-gradient-to-r from-emerald-600 to-blue-600 border-transparent text-white shadow-emerald-600/20 hover:opacity-90'}`}>
          <Sparkles size={15}/>
          <span>AI Maslahat</span>
          {!aiOpen&&<span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"/></span>}
        </motion.button>
      </div>

      {selectedHabits.length>0&&(
        <>
          <div className="mt-3 md:hidden">
            <div className="flex justify-between text-xs text-zinc-500 mb-1"><span>Kunlik progress</span><span className="text-white font-semibold">{successCount}/{selectedHabits.length} · {progressPercent}%</span></div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500" style={{width:`${progressPercent}%`}}/></div>
          </div>
          <div className="mt-3 flex gap-3">
            {[{label:'Bajarildi',count:successCount,color:'text-emerald-400'},{label:'Jarayonda',count:inProgressCount,color:'text-amber-400'},{label:'Bajarilmadi',count:selectedHabits.length-successCount-inProgressCount,color:'text-zinc-400'}].map((s)=>(
              <div key={s.label} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4">
        {loadingHabits&&(<div className="col-span-2 flex items-center justify-center py-12 text-zinc-500"><div className="w-5 h-5 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin mr-2"/>Yuklanmoqda...</div>)}
        {selectedHabits.map((habit)=>{
          const status=getStatus(habit);const isSaving=savingUid===habit.uid;const hasDesc=habit.description&&habit.description!=='-';
          return(
            <div key={habit.uid} className={`relative overflow-hidden rounded-[24px] flex flex-col border transition-all duration-300 ${status==='success'?'border-emerald-500 ring-4 ring-emerald-500/15':status==='in_progress'?'border-amber-400/50 ring-4 ring-amber-400/10':'border-zinc-800'}`}>
              <div className="relative h-32 overflow-hidden">
                <img src={habit.image} alt={habit.name} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"/>
                <div className="absolute top-2.5 left-2.5" onClick={(e)=>e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={()=>setHiddenUids((prev)=>prev.includes(habit.uid)?prev:[...prev,habit.uid])}
                    className="px-3 py-2 rounded-xl text-[11px] font-black border bg-black/40 border-white/10 text-white hover:border-white/20"
                  >
                    Qaytarish
                  </button>
                </div>
                <div className={`absolute top-2.5 right-2.5 h-8 w-8 rounded-full flex items-center justify-center border backdrop-blur-sm transition-all ${status==='success'?'bg-emerald-500/30 border-emerald-400/60 text-emerald-300':status==='in_progress'?'bg-amber-500/20 border-amber-400/40 text-amber-300':'bg-white/5 border-white/10 text-zinc-400'}`}>
                  {isSaving?<div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"/>:status==='success'?<Check size={14} strokeWidth={3}/>:status==='in_progress'?<Clock size={13}/>:<div className="w-2.5 h-2.5 rounded-full border-2 border-zinc-500"/>}
                </div>
                <div className="absolute bottom-2 left-3 right-3">
                  <h3 className="text-white font-semibold text-sm leading-tight line-clamp-1">{habit.name}</h3>
                  <span className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${status==='success'?'bg-emerald-500/20 text-emerald-300':status==='in_progress'?'bg-amber-500/20 text-amber-300':'bg-white/5 text-zinc-400'}`}>
                    {status==='success'?'✓ Bajarildi':status==='in_progress'?'⏳ Bajarilmoqda':'○ Bajarilmadi'}
                  </span>
                </div>
              </div>
              <button type="button" onClick={()=>{setDescHabit(habit);setDescOpen(true);}}
                className="mx-3 mt-2.5 flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-zinc-800/70 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all text-[11px] font-semibold">
                <FileText size={11}/>{hasDesc?"Tavsifni ko'rish":"Tavsif yo'q"}
              </button>
              <div className="flex gap-2 p-3 bg-zinc-950 mt-2">
                <button type="button" disabled={isSaving} onClick={()=>void handleSetStatus(habit,'in_progress')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center justify-center gap-1 ${status==='in_progress'?'bg-amber-500/25 border-amber-400/50 text-amber-200':'bg-zinc-800/60 border-zinc-700/50 text-zinc-300 hover:border-amber-400/30 hover:text-amber-300'}`}>
                  <Clock size={11}/>Bajaryapman
                </button>
                <button type="button" disabled={isSaving} onClick={()=>void handleSetStatus(habit,'success')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center justify-center gap-1 ${status==='success'?'bg-emerald-500/25 border-emerald-400/50 text-emerald-200':'bg-zinc-800/60 border-zinc-700/50 text-zinc-300 hover:border-emerald-400/30 hover:text-emerald-300'}`}>
                  <CheckCircle2 size={11}/>Bajardim
                </button>
              </div>
            </div>
          );
        })}
        {!loadingHabits&&selectedHabits.length===0&&(
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800"><CheckCircle2 size={28} className="text-zinc-600"/></div>
            <p className="text-zinc-400 font-medium">Hali odat tanlanmagan</p>
            <p className="text-zinc-600 text-sm mt-1">Odatlar sahifasidan card tanlang.</p>
          </div>
        )}
      </div>

      {/* Description Drawer */}
      <Drawer.Root open={descOpen} onOpenChange={(open)=>{setDescOpen(open);if(!open)setTimeout(()=>setDescHabit(null),300);}}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"/>
          <Drawer.Content className="fixed bottom-0 left-0 right-0 outline-none z-50 flex flex-col items-center">
            <VisuallyHidden><Drawer.Title>Odat tavsifi</Drawer.Title></VisuallyHidden>
            <div className="w-full max-w-md bg-zinc-900 border-t border-zinc-700/50 rounded-t-[32px] overflow-hidden shadow-2xl">
              {descHabit&&(<>
                <div className="relative h-44 w-full">
                  <img src={descHabit.image} alt={descHabit.name} className="w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-black/40 to-transparent"/>
                  <button onClick={()=>setDescOpen(false)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur border border-white/10 text-white flex items-center justify-center"><X size={18}/></button>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-white text-xl font-bold">{descHabit.name}</h2>
                    {(()=>{const s=getStatus(descHabit);return(<span className={`inline-block mt-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${s==='success'?'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40':s==='in_progress'?'bg-amber-500/25 text-amber-300 border border-amber-500/40':'bg-white/10 text-zinc-300 border border-white/10'}`}>{s==='success'?'✓ Bajarildi':s==='in_progress'?'⏳ Bajarilmoqda':'○ Bajarilmadi'}</span>);})()}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3"><div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center"><FileText size={14} className="text-blue-400"/></div><span className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">Tavsif</span></div>
                  <p className="text-zinc-200 text-sm leading-relaxed font-medium min-h-[60px]">{descHabit.description&&descHabit.description!=='-'?descHabit.description:"Bu odat uchun tavsif qo'shilmagan."}</p>
                  <div className="flex gap-3 mt-5">
                    <button type="button" onClick={()=>{void handleSetStatus(descHabit,'in_progress');setDescOpen(false);}} className={`flex-1 py-3 rounded-2xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${getStatus(descHabit)==='in_progress'?'bg-amber-500/25 border-amber-400/50 text-amber-200':'bg-zinc-800 border-zinc-700 text-zinc-300'}`}><Clock size={15}/>Bajaryapman</button>
                    <button type="button" onClick={()=>{void handleSetStatus(descHabit,'success');setDescOpen(false);}} className={`flex-1 py-3 rounded-2xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${getStatus(descHabit)==='success'?'bg-emerald-500/25 border-emerald-400/50 text-emerald-200':'bg-zinc-800 border-zinc-700 text-zinc-300'}`}><CheckCircle2 size={15}/>Bajardim</button>
                  </div>
                </div>
              </>)}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <AIHealthCoach isOpen={aiOpen} onClose={()=>setAiOpen(false)}/>

      <div className="fixed bottom-24 left-0 right-0 flex flex-col items-center gap-2 z-50 pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((toast)=>(
            <motion.div key={toast.id} initial={{opacity:0,y:20,scale:0.9}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-10,scale:0.95}} transition={{type:'spring',stiffness:400,damping:30}}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border pointer-events-auto max-w-xs w-full ${toast.status==='success'?'bg-emerald-950 border-emerald-700/50 text-emerald-200':'bg-amber-950 border-amber-700/50 text-amber-200'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${toast.status==='success'?'bg-emerald-500/20':'bg-amber-500/20'}`}>{toast.status==='success'?<Check size={16} strokeWidth={3}/>:<Clock size={15}/>}</div>
              <div className="flex-1 min-w-0"><p className="text-xs font-bold line-clamp-1">{toast.habitName}</p><p className="text-[11px] opacity-70 mt-0.5">{toast.status==='success'?'✅ Bajarildi deb belgilandi':'⏳ Bajarilmoqda deb belgilandi'}</p></div>
              <button onClick={()=>setToasts((prev)=>prev.filter((t)=>t.id!==toast.id))} className="opacity-50 hover:opacity-100 transition-opacity"><X size={14}/></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default Dashboard;
