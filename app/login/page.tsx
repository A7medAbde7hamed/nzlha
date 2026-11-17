'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, CheckCircle2, Clapperboard, Globe2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<'ar' | 'en'>('ar');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(''); setSuccess(false);
    try {
      const supabase = createClient();
      const result = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (result.error) throw result.error;
      if (mode === 'signup' && !result.data.session) { setSuccess(true); setMessage(t('Check your email to confirm your account, then sign in.', 'راجع بريدك الإلكتروني لتأكيد الحساب، ثم سجّل الدخول.')); }
      else router.push('/dashboard');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setMessage(code.includes('Invalid login credentials') ? t('Email or password is incorrect.', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.') : code.includes('already registered') ? t('This email already has an account. Sign in instead.', 'هذا البريد مسجل بالفعل. سجّل الدخول.') : t('We could not complete that request. Check your details and try again.', 'تعذر إكمال الطلب. راجع بياناتك وحاول مرة أخرى.'));
    } finally { setBusy(false); }
  }
  async function sendMagicLink() {
    if (!email.trim()) return;
    setBusy(true); setMessage(''); setSuccess(false);
    try {
      const { error } = await createClient().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (error) throw error;
      setSuccess(true); setMessage(t('A sign-in link is on its way. Check your inbox.', 'تم إرسال رابط الدخول. تحقق من بريدك الإلكتروني.'));
    } catch { setMessage(t('We could not send the link. Check the email and try again.', 'تعذر إرسال الرابط. تحقق من البريد وحاول مرة أخرى.')); }
    finally { setBusy(false); }
  }

  return <main className={`auth-shell ${ar ? 'rtl' : ''}`} dir={ar ? 'rtl' : 'ltr'}><div className="auth-orb orb-one"/><div className="auth-orb orb-two"/>
    <header className="auth-top"><Link href="/" className="auth-brand"><span><Clapperboard size={19}/></span><b>nzlha</b><small>STUDIO</small></Link><button className="auth-language" onClick={() => setLocale(ar ? 'en' : 'ar')}><Globe2 size={15}/>{t('العربية', 'English')}</button></header>
    <div className="auth-layout"><section className="auth-story"><div className="story-kicker"><span/> CREATOR WORKSPACE</div><h1>{t('A thoughtful home for everything you make.', 'مساحة تجمع كل ما تصنعه،\nبكل بساطة.')}</h1><p>{t('Keep your video ideas, files, and platform plans together. Your content stays yours.', 'اجمع أفكار الفيديوهات وملفاتك وخطط المنصات في مكان واحد. محتواك يظل ملكك.')}</p><div className="story-points"><span><ShieldCheck size={16}/>{t('Private by default', 'خصوصية من البداية')}</span><span><CheckCircle2 size={16}/>{t('Your work, clearly organized', 'عملك منظم وواضح')}</span></div><div className="platform-row">{['YouTube', 'Instagram', 'TikTok', 'Facebook'].map(platform => <span key={platform}>{platform}</span>)}</div></section>
      <section className="auth-card"><p className="auth-overline">{t('YOUR CREATOR SPACE', 'مساحتك الإبداعية')}</p><h2>{mode === 'signin' ? t('Welcome back', 'أهلاً بعودتك') : t('Create your account', 'أنشئ حسابك')}</h2><p className="auth-subtitle">{mode === 'signin' ? t('Sign in to continue to your workspace.', 'سجّل الدخول للمتابعة إلى مساحة عملك.') : t('Start organizing your videos in one private space.', 'ابدأ بتنظيم فيديوهاتك في مساحة خاصة.')}</p>
        <form onSubmit={submit}><label className="auth-label">{t('Email address', 'البريد الإلكتروني')}<span className="auth-input"><Mail size={16}/><input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/></span></label><label className="auth-label">{t('Password', 'كلمة المرور')}<span className="auth-input"><LockKeyhole size={16}/><input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={event => setPassword(event.target.value)} placeholder={t('At least 8 characters', '٨ أحرف على الأقل')}/></span></label><button className="auth-submit" disabled={busy}>{busy ? t('Please wait…', 'لحظة من فضلك…') : mode === 'signin' ? t('Sign in', 'تسجيل الدخول') : t('Create account', 'إنشاء الحساب')}<ArrowUpRight size={17}/></button></form>
        <button className="magic-link" disabled={busy || !email.trim()} onClick={sendMagicLink}>{t('Send me a sign-in link', 'أرسل رابط الدخول إلى بريدي')}</button>
        {message && <p className={`auth-message ${success ? 'success' : ''}`} role={success ? 'status' : 'alert'}>{message}</p>}
        <div className="auth-switch">{mode === 'signin' ? t('New to nzlha?', 'جديد في نزلها؟') : t('Already have an account?', 'لديك حساب بالفعل؟')} <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }}>{mode === 'signin' ? t('Create an account', 'أنشئ حساباً') : t('Sign in', 'سجّل الدخول')}</button></div>
        <p className="auth-foot"><ShieldCheck size={14}/>{t('Your videos are private to your account.', 'فيديوهاتك خاصة بحسابك.')}</p>
      </section></div>
    <footer className="auth-footer">NZLHA STUDIO <span>·</span> {t('A considered space for creators', 'مساحة متقنة لصناع المحتوى')}</footer>
  </main>;
}
