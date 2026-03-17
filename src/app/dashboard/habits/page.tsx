

"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Image as ImageIcon, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Drawer } from 'vaul';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from '../ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { setHabitSelected } from '@/lib/habitStore';

// VisuallyHidden component for accessibility
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
  <span className="sr-only">{children}</span>
);

// --- CardItem Component ---
const CardItem = ({ title, image, habitId, initialSelected, onToggle, onEdit, onDelete }: { 
  title: string, 
  image: string, 
  habitId: string,
  initialSelected: boolean,
  onToggle: (habitId: string, isSelected: boolean) => void 
  onEdit?: () => void,
  onDelete?: () => void,
}) => {
  const [isSelected, setIsSelected] = useState(initialSelected);

  useEffect(() => {
    setIsSelected(initialSelected);
  }, [initialSelected]);

  const handleClick = () => {
    const newSelectedState = !isSelected;
    setIsSelected(newSelectedState);
    onToggle(habitId, newSelectedState);
    
    // Save selected habit IDs to localStorage
    try {
      const raw = localStorage.getItem("selected_habit_ids_v1");
      const selectedIds = raw ? JSON.parse(raw) : [];
      
      if (newSelectedState) {
        // Add to selected IDs if not already present
        if (!selectedIds.includes(habitId)) {
          selectedIds.push(habitId);
        }
      } else {
        // Remove from selected IDs
        const index = selectedIds.indexOf(habitId);
        if (index > -1) {
          selectedIds.splice(index, 1);
        }
      }
      
      localStorage.setItem("selected_habit_ids_v1", JSON.stringify(selectedIds));
      
      // Trigger storage event for dashboard
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'selected_habit_ids_v1',
        newValue: JSON.stringify(selectedIds)
      }));
    } catch (error) {
      console.error('LocalStorage error:', error);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative cursor-pointer overflow-hidden rounded-[24px] h-44 transition-all duration-300 active:scale-95 border-2 ${
        isSelected ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-zinc-800 hover:border-zinc-600'
      }`}
    >
      <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
        <h3 className="text-white font-medium text-sm leading-tight">{title}</h3>
      </div>

      {(onEdit || onDelete) && (
        <div
          className="absolute top-3 left-3 flex gap-2 opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <button
              type="button"
              aria-label="Edit"
              onClick={onEdit}
              className="h-11 w-11 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 backdrop-blur border-2 border-blue-400/40 text-white hover:from-blue-400 hover:to-blue-500 flex items-center justify-center shadow-xl shadow-blue-500/30 transition-all duration-300 hover:scale-110"
            >
              <Pencil size={18} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              aria-label="Delete"
              onClick={onDelete}
              className="h-11 w-11 rounded-full bg-gradient-to-r from-red-500 to-pink-600 backdrop-blur border-2 border-red-400/40 text-white hover:from-red-400 hover:to-pink-500 flex items-center justify-center shadow-xl shadow-red-500/30 transition-all duration-300 hover:scale-110"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      )}
      {isSelected && (
        <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1 shadow-lg">
          <Check size={16} strokeWidth={3} />
        </div>
      )}
    </div>
  );
};

type Habit = {
  id?: number;
  title?: string | null;
  name?: string | null;
  icon_url: string;
  target_days: number;
  description: string;
  created_at?: string | null;
};

const Habits = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('main'); // 'main' | 'icons' | 'days' | 'desc'
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);



  
  // Form statelari
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedIcon, setSelectedIcon] = useState('https://via.placeholder.com/80?text=Icon');
  const [selectedDays, setSelectedDays] = useState<number>(1);
  const [habitName, setHabitName] = useState('');
  const [description, setDescription] = useState('');

  const editingHabit = useMemo(() => {
    if (editingHabitId == null) return null;
    return habits.find((h) => h.id === editingHabitId) ?? null;
  }, [editingHabitId, habits]);

  // Load selected habit IDs from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("selected_habit_ids_v1");
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setSelectedHabitIds(parsed);
      }
    } catch (error) {
      console.error('Error loading selected habits:', error);
    }
  }, []);

  const handleCardToggle = (habitId: string, isSelected: boolean) => {
    setSelectedHabitIds(prev => {
      const newIds = [...prev];
      
      if (isSelected) {
        if (!newIds.includes(habitId)) {
          newIds.push(habitId);
        }
      } else {
        const index = newIds.indexOf(habitId);
        if (index > -1) {
          newIds.splice(index, 1);
        }
      }
      
      return newIds;
    });

    // Supabase: tanlovni user'ga bog'lab saqlash (faqat numeric id uchun)
    if (user?.id) {
      const asNumber = Number(habitId);
      if (Number.isFinite(asNumber)) {
        void setHabitSelected(user.id, asNumber, isSelected);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedIcon(reader.result as string);
      setView('main');
    };
    reader.onerror = () => {
      alert("Rasmni o'qishda xatolik yuz berdi");
    };
    reader.readAsDataURL(file);
  };

  const loadHabits = async () => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('loadHabits error:', error);
      return;
    }
    if (data) setHabits(data);
  };

  useEffect(() => { loadHabits(); }, []);

  const beginCreate = () => {
    setEditingHabitId(null);
    resetForm();
    setIsOpen(true);
  };

  const beginEdit = (habit: Habit) => {
    if (!habit.id) return;
    setEditingHabitId(habit.id);
    setView('main');
    setHabitName(String(habit.title || habit.name || ''));
    setDescription(String(habit.description || ''));
    setSelectedDays(Number(habit.target_days ?? 1));
    setSelectedIcon(habit.icon_url || 'https://via.placeholder.com/80?text=Icon');
    setIsOpen(true);
  };

  const removeSelectedHabitIdEverywhere = (habitId: string) => {
    setSelectedHabitIds((prev) => prev.filter((x) => x !== habitId));
    try {
      const raw = localStorage.getItem("selected_habit_ids_v1");
      const parsed = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(parsed) ? (parsed as unknown[]).filter((x) => String(x) !== habitId) : [];
      localStorage.setItem("selected_habit_ids_v1", JSON.stringify(next));
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'selected_habit_ids_v1',
          newValue: JSON.stringify(next),
        }),
      );
    } catch (error) {
      console.error('LocalStorage error:', error);
    }
  };

  const deleteHabit = async (habit: Habit) => {
    if (!habit.id) return;

    try {
      const { error } = await supabase.from('habits').delete().eq('id', habit.id);
      if (error) throw error;
      removeSelectedHabitIdEverywhere(String(habit.id));
      await loadHabits();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      alert("O‘chirishda xatolik: " + message);
    }
  };

  const saveHabit = async () => {
    if (!habitName.trim()) {
      alert('Iltimos, odat nomini kiriting');
      return;
    }

    setLoading(true);
    const newHabit = {
      title: habitName.trim(),
      name: habitName.trim(),
      icon_url: selectedIcon,
      target_days: selectedDays,
      description: description.trim() || '-',
    };

    try {
      if (editingHabitId != null) {
        const { error } = await supabase.from('habits').update(newHabit).eq('id', editingHabitId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('habits').insert(newHabit);
        if (error) throw error;
      }

      await loadHabits();
      setIsOpen(false);
      resetForm();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      alert('Xatolik: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setView('main');
    setHabitName('');
    setDescription('');
    setSelectedDays(1);
    setSelectedIcon('https://via.placeholder.com/80?text=Icon');
    setEditingHabitId(null);
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-white p-6 pb-24">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Barcha yo&apos;llar</h1>
        </header>

        <div className="grid grid-cols-2 gap-4">
          {/* 1. Supabase bazasidan yuklangan odatlar (dinamik) */}
          {habits.map((habit) => {
            const title = habit.title || habit.name || 'Nomsiz odat';
            const key = habit.id ?? `${title}-${habit.created_at ?? ''}`;
            const habitId = String(habit.id || key);
            const isInitiallySelected = selectedHabitIds.includes(habitId);
            
            return (
              <CardItem
                key={String(key)}
                title={title}
                image={habit.icon_url || 'https://via.placeholder.com/300'}
                habitId={habitId}
                initialSelected={isInitiallySelected}
                onToggle={handleCardToggle}
                onEdit={habit.id ? () => beginEdit(habit) : undefined}
                onDelete={habit.id ? () => deleteHabit(habit) : undefined}
              />
            );
          })}

          {/* 2. Statik namunalar faqat jadval bo'sh bo'lsa */}
          {habits.length === 0 && (
            <>
              <CardItem
                title="Erta turish"
                image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4CQ7lTP6GADtwaRSzLmXVKjaHVTaCp0u8IA&s"
                habitId="static-erta-turish"
                initialSelected={selectedHabitIds.includes('static-erta-turish')}
                onToggle={handleCardToggle}
                
              />
              <CardItem title="Reja tuzish" image="https://idum.uz/wp-content/uploads/2015/05/dokument_600.jpg" habitId="static-reja-tuzish" initialSelected={selectedHabitIds.includes('static-reja-tuzish')} onToggle={handleCardToggle} />
              <CardItem
                title="Moliyaviy nazorat"
                image="https://podrobno.uz/upload/iblock/983/1p4mf0astuk20fkqukhxcfj7ahjmakux/654654644745.jpg"
                habitId="static-moliyaviy-nazorat"
                initialSelected={selectedHabitIds.includes('static-moliyaviy-nazorat')}
                onToggle={handleCardToggle}
              />
              <CardItem title="Drink Water" image="https://tdsrx.com/cdn/shop/articles/water.webp?v=1746550925" habitId="static-drink-water" initialSelected={selectedHabitIds.includes('static-drink-water')} onToggle={handleCardToggle} />
              <CardItem
                title="Read book"
                image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwksRMbg8-t7lCathIkt_WxysyC_cvkpC4vg&s"
                habitId="static-read-book"
                initialSelected={selectedHabitIds.includes('static-read-book')}
                onToggle={handleCardToggle}
              />
              <CardItem title="Coding" image="https://miro.medium.com/v2/resize:fit:1400/0*7VyEZgzwUhQMeBqb" habitId="static-coding" initialSelected={selectedHabitIds.includes('static-coding')} onToggle={handleCardToggle} />
              <CardItem title="Workout" image="https://i.ytimg.com/vi/fYzBmBScl1I/maxresdefault.jpg" habitId="static-workout" initialSelected={selectedHabitIds.includes('static-workout')} onToggle={handleCardToggle} />
              <CardItem
                title="Stressni boshqarish"
                image="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=80"
                habitId="static-stressni-boshqarish"
                initialSelected={selectedHabitIds.includes('static-stressni-boshqarish')}
                onToggle={handleCardToggle}
              />
              <CardItem
                title="Raqamli detoks"
                image="https://www.afisha.uz/uploads/media/2025/12/2174a184ec82fb10e6caeb8f1f04ac04_lf.webp"
                habitId="static-raqamli-detoks"
                initialSelected={selectedHabitIds.includes('static-raqamli-detoks')}
                onToggle={handleCardToggle}
              />
              <CardItem title="Har kunlik piyoda yurish" image="https://xabar.uz/static/crop/1/7/920__95_1783015654.jpeg" habitId="static-piyoda-yurish" initialSelected={selectedHabitIds.includes('static-piyoda-yurish')} onToggle={handleCardToggle} />
            </>
          )}
        </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center z-40">
        <button
          onClick={beginCreate}
          className="w-full max-w-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-2xl shadow-blue-600/30 transition-all active:scale-95"
        >
          Odat qo&apos;shish
        </button>
      </div>




      <Drawer.Root open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[96vh] outline-none z-50 flex flex-col items-center">
            {/* Accessibility: Hidden DrawerTitle */}
            <VisuallyHidden>
              <Drawer.Title>
                {editingHabit ? 'Odatni tahrirlash' : 'Yangi odat qo\'shish'}
              </Drawer.Title>
            </VisuallyHidden>
            
            <div className="w-full max-w-md bg-[#121214] border-t border-zinc-800 rounded-t-[40px] p-6 shadow-2xl">
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6" />

              <AnimatePresence mode="wait">
                {view === 'main' && (
                  <motion.div key="main" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-5">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold">{editingHabit ? 'Odatni tahrirlash' : 'Odatni shakllantiring'}</h2>
                      <button onClick={() => setIsOpen(false)} className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white"><X size={20} /></button>
                    </div>

                    <div className="space-y-3">
                      {/* Image Picker */}
                      <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-zinc-800 rounded-xl overflow-hidden flex items-center justify-center border border-zinc-700">
                                <img src={selectedIcon} className="w-full h-full object-cover" alt="Selected" />
                            </div>
                            <span className="text-sm font-medium text-zinc-300">Odat belgisi</span>
                        </div>
                        <button onClick={() => setView('icons')} className="text-blue-500 text-sm font-semibold flex items-center gap-1">
                          Rasm tanlash <ChevronRight size={16} />
                        </button>
                      </div>

                      {/* Name Input */}
                      <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1 block">Odat nomi</label>
                        <input
                          type="text"
                          value={habitName}
                          onChange={(e) => setHabitName(e.target.value)}
                          placeholder="Masalan: Kitob o'qish"
                          className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-zinc-700"
                        />
                      </div>

                      {/* Description Button */}
                      <button onClick={() => setView('desc')} className="w-full flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                        <div className="text-left">
                          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block">Tavsif</label>
                          <span className="text-sm text-zinc-400 line-clamp-1">{description || "Qisqacha ma'lumot..."}</span>
                        </div>
                        <ChevronRight size={18} className="text-zinc-600" />
                      </button>

                      {/* Days Selection */}
                      <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block">Amal qilish muddati</label>
                          <span className="text-lg font-bold text-white">{selectedDays} kun</span>
                        </div>
                        <button onClick={() => setView('days')} className="bg-zinc-800 px-4 py-2 rounded-xl text-xs font-bold hover:bg-zinc-700 transition-colors">
                          Kunlarni tanlash
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 grid grid-cols-1 gap-3">
                      <button 
                        onClick={saveHabit} 
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        {loading ? <Loader2 className="animate-spin" /> : (editingHabit ? "O'ZGARTIRISH" : 'SAQLASH')}
                      </button>
                      <button onClick={() => setIsOpen(false)} className="w-full py-4 text-zinc-500 font-medium">Bekor qilish</button>
                    </div>
                  </motion.div>
                )}

                {view === 'icons' && (
                  <motion.div key="icons" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
                    <button onClick={() => setView('main')} className="flex items-center gap-2 text-zinc-500"><ChevronLeft size={20}/> Orqaga</button>
                    <h3 className="text-xl font-bold">Rasm tanlang</h3>
                    <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-zinc-800 rounded-[32px] bg-zinc-900/30 cursor-pointer hover:bg-zinc-900/50 transition-all">
                      <ImageIcon size={40} className="text-zinc-700 mb-2" />
                      <span className="text-sm text-zinc-500">Galereyadan yuklash</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </motion.div>
                )}

                {view === 'days' && (
                  <motion.div key="days" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
                    <button onClick={() => setView('main')} className="flex items-center gap-2 text-zinc-500"><ChevronLeft size={20}/> Orqaga</button>
                    <div className="bg-zinc-900/80 p-6 rounded-[32px] border border-zinc-800 text-center">
                      <h3 className="text-2xl font-bold mb-6">Haftada necha kun?</h3>
                      <div className="flex justify-between gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                          <button 
                            key={d} 
                            onClick={() => setSelectedDays(d)}
                            className={`w-11 h-11 rounded-full flex items-center justify-center font-bold transition-all ${selectedDays === d ? 'bg-blue-600 scale-110 shadow-lg shadow-blue-600/40' : 'bg-zinc-800 text-zinc-500'}`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setView('main')} className="w-full py-4 bg-blue-600 rounded-2xl font-bold">TAYYOR</button>
                  </motion.div>
                )}

                {view === 'desc' && (
                  <motion.div key="desc" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
                    <button onClick={() => setView('main')} className="flex items-center gap-2 text-zinc-500"><ChevronLeft size={20}/> Orqaga</button>
                    <h3 className="text-xl font-bold">Odat tavsifi</h3>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ushbu odat haqida batafsil..."
                      className="w-full h-40 bg-zinc-900 rounded-[24px] p-5 border border-zinc-800 focus:border-blue-500 outline-none resize-none text-zinc-300"
                    />
                    <button onClick={() => setView('main')} className="w-full py-4 bg-blue-600 rounded-2xl font-bold">SAQLASH</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
    </ErrorBoundary>
  );
};

export default Habits;
