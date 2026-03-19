"use client";
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Image as ImageIcon, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Drawer } from 'vaul';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from '../ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { getSelectedHabitIds, setHabitSelected } from '@/lib/habitStore';

type HabitId = string;
type Habit = { id?: number; title?: string | null; name?: string | null; icon_url: string; target_days: number; description: string; created_at?: string | null; };

const VisuallyHidden = ({ children }: { children: React.ReactNode }) => <span className="sr-only">{children}</span>;

const CardItem = ({ title, image, habitId, initialSelected, onToggle, onEdit, onDelete }: {
  title: string; image: string; habitId: HabitId; initialSelected: boolean;
  onToggle: (habitId: HabitId, isSelected: boolean) => void | Promise<void>;
  onEdit?: () => void; onDelete?: () => void;
}) => {
  const [isSelected, setIsSelected] = useState(initialSelected);
  useEffect(() => { setIsSelected(initialSelected); }, [initialSelected]);
  const handleClick = async () => { const next = !isSelected; setIsSelected(next); await onToggle(habitId, next); };
  return (
    <div onClick={() => void handleClick()}
      className={`group relative cursor-pointer overflow-hidden rounded-[24px] h-44 transition-all duration-300 active:scale-95 border-2 ${isSelected ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-zinc-800 hover:border-zinc-600'}`}>
      <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
        <h3 className="text-white font-medium text-sm leading-tight">{title}</h3>
      </div>
      {(onEdit || onDelete) && (
        <div className="absolute top-3 left-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
          {onEdit && <button type="button" onClick={onEdit} className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 backdrop-blur border-2 border-blue-400/40 text-white flex items-center justify-center shadow-xl transition-all hover:scale-110"><Pencil size={16} /></button>}
          {onDelete && <button type="button" onClick={onDelete} className="h-10 w-10 rounded-full bg-gradient-to-r from-red-500 to-pink-600 backdrop-blur border-2 border-red-400/40 text-white flex items-center justify-center shadow-xl transition-all hover:scale-110"><Trash2 size={16} /></button>}
        </div>
      )}
      {isSelected && <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1 shadow-lg"><Check size={16} strokeWidth={3} /></div>}
    </div>
  );
};

const STATIC_HABITS = [
  { key:'static-erta-turish',       title:'Erta turish',              image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4CQ7lTP6GADtwaRSzLmXVKjaHVTaCp0u8IA&s' },
  { key:'static-reja-tuzish',       title:'Reja tuzish',              image:'https://idum.uz/wp-content/uploads/2015/05/dokument_600.jpg' },
  { key:'static-moliyaviy-nazorat', title:'Moliyaviy nazorat',        image:'https://podrobno.uz/upload/iblock/983/1p4mf0astuk20fkqukhxcfj7ahjmakux/654654644745.jpg' },
  { key:'static-drink-water',       title:'Drink Water',              image:'https://tdsrx.com/cdn/shop/articles/water.webp?v=1746550925' },
  { key:'static-read-book',         title:'Read book',                image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwksRMbg8-t7lCathIkt_WxysyC_cvkpC4vg&s' },
  { key:'static-coding',            title:'Coding',                   image:'https://miro.medium.com/v2/resize:fit:1400/0*7VyEZgzwUhQMeBqb' },
  { key:'static-workout',           title:'Workout',                  image:'https://i.ytimg.com/vi/fYzBmBScl1I/maxresdefault.jpg' },
  { key:'static-stress',            title:'Stressni boshqarish',      image:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=80' },
  { key:'static-detoks',            title:'Raqamli detoks',           image:'https://www.afisha.uz/uploads/media/2025/12/2174a184ec82fb10e6caeb8f1f04ac04_lf.webp' },
  { key:'static-piyoda',            title:'Har kunlik piyoda yurish', image:'https://xabar.uz/static/crop/1/7/920__95_1783015654.jpeg' },
] as const;

const LS_KEY = 'selected_habit_ids_v1';
const LS_STATIC_KEY = 'selected_static_habit_keys_v1';
function readLocalNumericIds(): string[] { try { const raw=localStorage.getItem(LS_KEY); const p=raw?(JSON.parse(raw) as unknown[]):[]; return Array.isArray(p)?p.map(String).filter((s)=>/^\d+$/.test(s)):[]; } catch{return[];} }
function writeLocalNumericIds(ids:string[]) { try { localStorage.setItem(LS_KEY,JSON.stringify(ids)); window.dispatchEvent(new StorageEvent('storage',{key:LS_KEY,newValue:JSON.stringify(ids)})); }catch{} }
function readLocalStaticKeys(): string[] { try { const raw=localStorage.getItem(LS_STATIC_KEY); const p=raw?(JSON.parse(raw) as unknown[]):[]; return Array.isArray(p)?p.map(String):[]; }catch{return[];} }
function writeLocalStaticKeys(keys:string[]) { try { localStorage.setItem(LS_STATIC_KEY,JSON.stringify(keys)); window.dispatchEvent(new StorageEvent('storage',{key:LS_STATIC_KEY,newValue:JSON.stringify(keys)})); }catch{} }

const Habits = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedNumericIds, setSelectedNumericIds] = useState<string[]>([]);
  const [selectedStaticKeys, setSelectedStaticKeys] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'main'|'icons'|'days'|'desc'>('main');
  const [editingHabitId, setEditingHabitId] = useState<number|null>(null);
  const [selectedIcon, setSelectedIcon] = useState('https://via.placeholder.com/80?text=Icon');
  const [selectedDays, setSelectedDays] = useState(1);
  const [habitName, setHabitName] = useState('');
  const [description, setDescription] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const editingHabit = useMemo(() => editingHabitId!=null ? habits.find((h)=>h.id===editingHabitId)??null : null, [editingHabitId,habits]);

  const loadHabits = async () => {
    const { data, error } = await supabase.from('habits').select('*').order('created_at',{ascending:false});
    if (error) {
      console.error('loadHabits:',error);
      alert("Odatlarni yuklashda xatolik: " + error.message);
      return;
    }
    const normalized = ((data??[]) as any[]).map((row)=>({...row, id:typeof row.id==='number'?row.id:Number(String(row.id))})) as Habit[];
    setHabits(normalized.filter((h)=>Number.isFinite(h.id)));
  };

  useEffect(() => { void loadHabits(); }, []);

  useEffect(() => {
    const sync = async () => {
      setSelectedStaticKeys(readLocalStaticKeys());
      if (user?.id) { const remote=await getSelectedHabitIds(user.id); if(remote.length>0){setSelectedNumericIds(remote.map(String));return;} }
      setSelectedNumericIds(readLocalNumericIds());
    };
    void sync();
  }, [user?.id]);

  useEffect(() => { writeLocalNumericIds(selectedNumericIds); }, [selectedNumericIds]);

  const handleDbHabitToggle = async (habitId:HabitId, isSelected:boolean) => {
    const numericId=Number(habitId); if(!Number.isFinite(numericId))return;
    setSelectedNumericIds((prev)=>{const s=new Set(prev);if(isSelected)s.add(String(numericId));else s.delete(String(numericId));return Array.from(s);});
    if(user?.id) await setHabitSelected(user.id,numericId,isSelected);
  };

  const handleStaticHabitToggle = (key:HabitId, isSelected:boolean) => {
    setSelectedStaticKeys((prev)=>{const s=new Set(prev);if(isSelected)s.add(key);else s.delete(key);const next=Array.from(s);writeLocalStaticKeys(next);return next;});
  };

  const deleteHabit = async (habit:Habit) => {
    if(!habit.id)return;
    if(!window.confirm(`"${habit.title||habit.name}" odatini o'chirmoqchimisiz?`))return;
    const{error}=await supabase.from('habits').delete().eq('id',habit.id);
    if(error){alert("O'chirishda xatolik: "+error.message);return;}
    const upd=selectedNumericIds.filter((x)=>x!==String(habit.id));
    setSelectedNumericIds(upd); writeLocalNumericIds(upd);
    if(user?.id) await setHabitSelected(user.id,habit.id,false);
    await loadHabits();
  };

  const resetForm = () => { setView('main');setHabitName('');setDescription('');setSelectedDays(1);setSelectedIcon('https://via.placeholder.com/80?text=Icon');setEditingHabitId(null); };
  const beginCreate = () => { resetForm(); setIsOpen(true); };
  const beginEdit = (habit:Habit) => {
    if(!habit.id)return;
    setEditingHabitId(habit.id); setView('main');
    setHabitName(String(habit.title||habit.name||''));
    setDescription(String(habit.description||''));
    setSelectedDays(Number(habit.target_days??1));
    setSelectedIcon(habit.icon_url||'https://via.placeholder.com/80?text=Icon');
    setIsOpen(true);
  };

  const saveHabit = async () => {
    const trimmedName = habitName.trim();
    if(!trimmedName){alert('Iltimos, odat nomini kiriting');return;}
    if(trimmedName.length > 80){alert('Odat nomi 80 ta belgidan qisqaroq bo\'lishi kerak');return;}
    if(selectedDays < 1 || selectedDays > 7){alert('Kunlar soni 1 va 7 orasida bo\'lishi kerak');return;}
    setLoading(true);
    const payload = {
      title: trimmedName,
      name:  trimmedName,
      icon_url: selectedIcon,
      target_days: selectedDays,
      description: description.trim()||'-',
    };
    try {
      if(editingHabitId!=null) {
        const{error}=await supabase.from('habits').update(payload).eq('id',editingHabitId);
        if(error) throw error;
      } else {
        // INSERT — user_id bilan
        const{data,error}=await supabase.from('habits').insert(payload).select('id').single();
        if(error) throw error;
        if(data && user?.id) {
          const newId=(data as {id:number}).id;
          setSelectedNumericIds((prev)=>[...prev,String(newId)]);
          await setHabitSelected(user.id,newId,true);
        }
      }
      await loadHabits();
      try {
        audioRef.current?.play().catch(()=>{ /* ignore */ });
      } catch {
        // ignore audio errors
      }
      setIsOpen(false);
      resetForm();
    } catch(e:unknown) {
      alert('Xatolik: '+(e instanceof Error?e.message:String(e)));
    } finally { setLoading(false); }
  };

  const handleImageUpload = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{setSelectedIcon(reader.result as string);setView('main');};
    reader.readAsDataURL(file);
  };

  const dbHabits = habits.filter((h)=>!String(h.name??'').startsWith('static-'));
  const variants = { enter:(d:number)=>({x:d>0?50:-50,opacity:0}), center:{x:0,opacity:1}, exit:(d:number)=>({x:d<0?50:-50,opacity:0}) };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-white p-6 pb-24">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Odatlar</h1>
        </header>

        <div className="grid grid-cols-2 gap-4">
          {dbHabits.map((habit) => (
            <CardItem key={String(habit.id)}
              title={habit.title||habit.name||'Nomsiz odat'}
              image={habit.icon_url||'https://via.placeholder.com/300'}
              habitId={String(habit.id)}
              initialSelected={selectedNumericIds.includes(String(habit.id))}
              onToggle={handleDbHabitToggle}
              onEdit={()=>beginEdit(habit)}
              onDelete={()=>void deleteHabit(habit)} />
          ))}
          {STATIC_HABITS.map((h) => (
            <CardItem key={h.key} title={h.title} image={h.image} habitId={h.key}
              initialSelected={selectedStaticKeys.includes(h.key)}
              onToggle={handleStaticHabitToggle} />
          ))}
        </div>

        <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center z-40">
          <button onClick={beginCreate} className="w-full max-w-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-2xl shadow-blue-600/30 transition-all active:scale-95">
            Odat qo&apos;shish
          </button>
        </div>

        <Drawer.Root open={isOpen} onOpenChange={(open)=>{setIsOpen(open);if(!open)resetForm();}}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-50" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[96vh] outline-none z-50 flex flex-col items-center">
              <VisuallyHidden><Drawer.Title>{editingHabit?'Odatni tahrirlash':"Yangi odat qo'shish"}</Drawer.Title></VisuallyHidden>
              <div className="w-full max-w-md bg-white text-zinc-900 border-t border-zinc-200 rounded-t-[40px] p-6 shadow-2xl">
                <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-6" />
                <AnimatePresence mode="wait">
                  {view==='main' && (
                    <motion.div key="main" variants={variants} custom={1} initial="enter" animate="center" exit="exit" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">{editingHabit?'Odatni tahrirlash':'Odatni shakllantiring'}</h2>
                        <button onClick={()=>setIsOpen(false)} className="p-2 bg-zinc-100 rounded-full text-zinc-600"><X size={20}/></button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 flex-shrink-0">
                              <img src={selectedIcon} className="w-full h-full object-cover" alt="icon"/>
                            </div>
                            <span className="text-sm font-semibold">Odat belgisi</span>
                          </div>
                          <button onClick={()=>setView('icons')} className="text-blue-500 text-sm font-semibold flex items-center gap-1">Rasm tanlash<ChevronRight size={16}/></button>
                        </div>
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                          <label className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-widest mb-1 block">Odat nomi</label>
                          <input type="text" value={habitName} onChange={(e)=>setHabitName(e.target.value)} placeholder="Masalan: Kitob o'qish"
                            className="w-full bg-transparent text-lg font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"/>
                        </div>
                        <button onClick={()=>setView('desc')} className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-left">
                          <div className="flex-1 min-w-0">
                            <label className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-widest block">Tavsif</label>
                            <span className={`text-sm font-semibold line-clamp-1 ${description?'text-zinc-800':'text-zinc-400'}`}>{description||"Qisqacha ma'lumot kiriting..."}</span>
                          </div>
                          <ChevronRight size={18} className="text-zinc-400 flex-shrink-0 ml-2"/>
                        </button>
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                          <div>
                            <label className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-widest block">Amal qilish muddati</label>
                            <span className="text-lg font-bold text-zinc-900">{selectedDays} kun</span>
                          </div>
                          <button onClick={()=>setView('days')} className="bg-zinc-200 px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-300 transition-colors">Kunlarni tanlash</button>
                        </div>
                      </div>
                      <div className="pt-2 space-y-3">
                        <button onClick={()=>void saveHabit()} disabled={loading}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all">
                          {loading?<Loader2 className="animate-spin" size={20}/>:editingHabit?"O'ZGARTIRISH":'SAQLASH'}
                        </button>
                        <button onClick={()=>setIsOpen(false)} className="w-full py-3 text-zinc-600 font-semibold text-sm">Bekor qilish</button>
                      </div>
                    </motion.div>
                  )}
                  {view==='icons' && (
                    <motion.div key="icons" variants={variants} custom={1} initial="enter" animate="center" exit="exit" className="space-y-5">
                      <button onClick={()=>setView('main')} className="flex items-center gap-2 text-zinc-700 font-semibold"><ChevronLeft size={20}/>Orqaga</button>
                      <h3 className="text-xl font-bold">Rasm tanlang</h3>
                      <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-zinc-200 rounded-[32px] bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition-all group">
                        <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-zinc-200 transition-colors"><ImageIcon size={32} className="text-zinc-500"/></div>
                        <span className="text-sm font-semibold text-zinc-700">Galereyadan yuklash</span>
                        <span className="text-xs text-zinc-400 mt-1">JPG, PNG, WEBP</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                      </label>
                    </motion.div>
                  )}
                  {view==='days' && (
                    <motion.div key="days" variants={variants} custom={1} initial="enter" animate="center" exit="exit" className="space-y-5">
                      <button onClick={()=>setView('main')} className="flex items-center gap-2 text-zinc-700 font-semibold"><ChevronLeft size={20}/>Orqaga</button>
                      <div className="bg-zinc-50 p-6 rounded-[28px] border border-zinc-200 text-center">
                        <h3 className="text-xl font-bold mb-5">Haftada necha kun?</h3>
                        <div className="flex justify-between gap-1.5">
                          {[1,2,3,4,5,6,7].map((d)=>(
                            <button key={d} onClick={()=>setSelectedDays(d)}
                              className={`flex-1 h-11 rounded-full font-bold text-sm transition-all ${selectedDays===d?'bg-blue-600 scale-110 shadow-lg shadow-blue-600/30 text-white':'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>{d}</button>
                          ))}
                        </div>
                      </div>
                      <button onClick={()=>setView('main')} className="w-full py-4 bg-blue-600 rounded-2xl font-bold text-white">TAYYOR</button>
                    </motion.div>
                  )}
                  {view==='desc' && (
                    <motion.div key="desc" variants={variants} custom={1} initial="enter" animate="center" exit="exit" className="space-y-5">
                      <button onClick={()=>setView('main')} className="flex items-center gap-2 text-zinc-700 font-semibold"><ChevronLeft size={20}/>Orqaga</button>
                      <div>
                        <h3 className="text-xl font-bold">Odat tavsifi</h3>
                        <p className="text-xs text-zinc-500 mt-1">Bu tavsif Supabasega saqlanadi va dashboard cardida ko'rinadi.</p>
                      </div>
                      <textarea value={description} onChange={(e)=>setDescription(e.target.value)}
                        placeholder="Masalan: Har kuni ertalab soat 6:00 da turish..."
                        className="w-full h-44 bg-zinc-50 rounded-[20px] p-4 border border-zinc-200 focus:border-blue-400 outline-none resize-none text-zinc-900 text-sm font-medium placeholder:text-zinc-400 leading-relaxed"/>
                      <div className="flex gap-3">
                        <button onClick={()=>{setDescription('');setView('main');}} className="flex-1 py-3.5 border border-zinc-200 rounded-2xl font-semibold text-zinc-600 text-sm">Tozalash</button>
                        <button onClick={()=>setView('main')} className="flex-1 py-3.5 bg-blue-600 rounded-2xl font-bold text-white text-sm">SAQLASH</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
        <audio
          ref={audioRef}
          src="https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
          className="hidden"
        />
      </div>
    </ErrorBoundary>
  );
};
export default Habits;
