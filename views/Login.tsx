
import React, { useState, useEffect } from 'react';
import { Role } from '../types';
import { Button, Input, Select, Card, Modal } from '../components/ui';
import { Eye, EyeOff } from 'lucide-react';
import * as H from '../utils/helpers';
import { auth } from '../services/db';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface LoginProps {
  users: any[];
  onLogin: (u: any) => void;
  schoolName: string;
  settings?: { secretKey?: string, secretCount?: number, adminPassword?: string, language?: 'ru' | 'en' };
}

export default function Login({ schoolName, settings }: LoginProps) {
  const [role, setRole] = useState<Role>('student');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [spaceCount, setSpaceCount] = useState(0);
  const [iconTapCount, setIconTapCount] = useState(0);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  const secretKey = settings?.secretKey || 'Space';
  const secretTriggerCount = settings?.secretCount || 4;
  const realAdminPass = settings?.adminPassword || 'admin';
  const lang = settings?.language || 'ru';
  const t = (k: string) => H.t(k, lang);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === secretKey) {
        setSpaceCount(prev => {
           const next = prev + 1;
           if (next >= secretTriggerCount) {
              e.preventDefault();
              setShowAdminModal(true);
              return 0;
           }
           return next;
        });
        setTimeout(() => setSpaceCount(0), 1000);
      }
      if (e.key === 'Enter' && !showAdminModal) {
          handleAuth();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [secretKey, secretTriggerCount, showAdminModal, login, password, role]);

  const handleIconTap = () => {
    if (window.innerWidth > 1024) return;
    setIconTapCount(prev => {
      const next = prev + 1;
      if (next >= secretTriggerCount) {
        setShowAdminModal(true);
        return 0;
      }
      return next;
    });
    setTimeout(() => setIconTapCount(0), 1000);
  };

  const handleAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!login && !password) return;

    setLoading(true);
    setError('');
    
    // We construct the email from the login name
    const email = `${login.toLowerCase().trim()}@elzhur.app`;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Successful login: App.tsx will detect the state change and render the dashboard.
    } catch (err: any) {
        // Special case: Initial bootstrapping of the creator
        if (login.toLowerCase() === 'creator' && password === realAdminPass) {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
            } catch (createErr: any) {
                setError('First setup error: ' + createErr.message);
                setLoading(false);
            }
        } else {
            setError(t('invalid_login'));
            setLoading(false);
        }
    }
  };

  const handleCreatorAuth = async () => {
    if (adminPass === realAdminPass) {
        const email = `creator@elzhur.app`;
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, adminPass);
        } catch (err: any) {
            try {
                await createUserWithEmailAndPassword(auth, email, adminPass);
            } catch (e: any) {
                alert('Bootstrapping error ' + e.message);
                setLoading(false);
            }
        }
    } else {
        alert(t('invalid_login'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 dark:bg-slate-950 font-sans">
      <Card className="w-full max-w-md p-8 shadow-2xl border-t-[6px] border-t-blue-600 dark:border-t-blue-500">
        <div className="text-center mb-10">
           <div 
             onClick={handleIconTap}
             className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-4xl font-bold rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow transform hover:scale-105 transition-transform duration-300 font-heading cursor-pointer select-none"
           >
             {lang === 'ru' ? 'Э' : 'E'}
           </div>
           <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 font-heading">{schoolName}</h2>
           <p className="text-slate-500 dark:text-slate-400">{t('login_title')}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">{t('login')}</label>
            <Input disabled={loading} value={login} onChange={(e) => setLogin(e.target.value)} placeholder={t('enter_login')} className="h-12" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">{t('password')}</label>
            <Input disabled={loading} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('enter_pass')} className="h-12" />
          </div>
          
          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">{error}</div>}
          
          <div className="pt-6">
             <Button disabled={loading} type="submit" variant="primary" className="w-full h-12 text-base shadow-blue-500/30">
                 {loading ? t('loading') : t('enter')}
             </Button>
          </div>
        </form>
      </Card>

      <Modal isOpen={showAdminModal} onClose={() => {setShowAdminModal(false); setShowAdminPass(false);}} title={t('login_as_creator')}>
         <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('enter_pass')}</p>
            <div className="relative">
                <form onSubmit={(e) => { e.preventDefault(); handleCreatorAuth(); }}>
                    <Input 
                      autoFocus
                      disabled={loading}
                      type={showAdminPass ? 'text' : 'password'} 
                      value={adminPass} 
                      onChange={e => setAdminPass(e.target.value)} 
                      placeholder={t('password')} 
                    />
                    <button 
                        type="button"
                        onMouseDown={() => setShowAdminPass(true)}
                        onMouseUp={() => setShowAdminPass(false)}
                        onMouseLeave={() => setShowAdminPass(false)}
                        onTouchStart={() => setShowAdminPass(true)}
                        onTouchEnd={() => setShowAdminPass(false)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer p-0.5 bg-white dark:bg-slate-900 rounded"
                    >
                        {showAdminPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    <div className="mt-4">
                        <Button disabled={loading} type="submit" variant="primary" className="w-full">{loading ? t('loading') : t('enter')}</Button>
                    </div>
                </form>
            </div>
            <p className="text-[10px] text-slate-400 italic text-center">{t('hold_eye_hint')}</p>
         </div>
      </Modal>
    </div>
  );
}
