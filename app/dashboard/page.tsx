'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, CalendarDays, Check, ChevronDown, Clapperboard, CloudUpload, FileVideo2, Film, Globe2, LayoutDashboard, Link2, LoaderCircle, LogOut, Menu, Plus, Search, Settings2, ShieldCheck, Trash2, Video, X, Youtube, Instagram, Facebook } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Platform = 'youtube' | 'instagram' | 'tiktok' | 'facebook';
type Post = { id: string; title: string; description: string; platforms: Platform[]; status: 'draft' | 'ready'; scheduled_at: string | null; storage_path: string | null; original_filename: string | null; created_at: string };
const platformList: { id: Platform; name: string; Icon: typeof Youtube }[] = [
  { id: 'youtube', name: 'YouTube', Icon: Youtube }, { id: 'instagram', name: 'Instagram', Icon: Instagram },
  { id: 'tiktok', name: 'TikTok', Icon: Video }, { id: 'facebook', name: 'Facebook', Icon: Facebook },
];
const copy = {
  en: { overview: 'Overview', content: 'Video library', calendar: 'Calendar', accounts: 'Platforms', settings: 'Settings', workspace: 'WORKSPACE', drafts: 'Saved videos', selected: 'Selected platforms', create: 'Add a video', subtitle: 'A calm workspace for the videos you plan to publish.', search: 'Search your videos', total: 'Videos in your library', ready: 'Ready when integrations are connected', connected: 'Connected accounts', unavailable: 'No accounts connected', upcoming: 'Your videos', all: 'All videos', emptyTitle: 'Your library starts here', emptyBody: 'Save a video with its title and intended platforms. Nothing will be published until you connect and authorize an official platform integration.', emptyAction: 'Add your first video', noResults: 'No videos match that search.', createTitle: 'Add to your library', title: 'Video title', titleHint: 'A short, descriptive title', description: 'Notes (optional)', platforms: 'Intended platforms', choose: 'Choose one or more platforms', video: 'Video file (optional)', drop: 'Choose a video from your device', fileHint: 'MP4, MOV, or WebM · up to 50 MB · stored privately', save: 'Save video', saving: 'Saving…', loading: 'Loading your library…', retry: 'Try again', draft: 'Saved', cancel: 'Cancel', saved: 'Video saved to your private library.', removed: 'Video removed.', error: 'Something went wrong. Please try again.', noPlatforms: 'Choose at least one platform.', tooLarge: 'Choose a video smaller than 50 MB.', badFile: 'Choose an MP4, MOV, or WebM video.', signOut: 'Sign out', language: 'العربية', today: 'Your workspace', secure: 'Private to your account', integrationTitle: 'Platform connections', integrationBody: 'No accounts are connected. Official OAuth permissions and platform review are required before publishing can be offered.', integrationStatus: 'Not connected', noPublishing: 'Publishing and scheduling are not available yet', noPublishingBody: 'This workspace stores your video details and private files. Automated publishing requires official platform APIs, account authorization, and reliable background jobs.', latest: 'Recently added', delete: 'Delete', deleting: 'Deleting…', videoOptional: 'You can add a video file now or save the details first.', calendarEmpty: 'Scheduling will appear here after publishing integrations are implemented.', month: 'Your saved videos', account: 'Account', languageLabel: 'Language', privateStorage: 'Private video storage', privateStorageBody: 'Uploaded files are private and accessible only to your account.', allPlatforms: 'Platform selection only records where you intend to publish.' },
  ar: { overview: 'نظرة عامة', content: 'مكتبة الفيديوهات', calendar: 'التقويم', accounts: 'المنصات', settings: 'الإعدادات', workspace: 'مساحة العمل', drafts: 'فيديوهات محفوظة', selected: 'المنصات المحددة', create: 'أضف فيديو', subtitle: 'مساحة هادئة للفيديوهات التي تخطط لنشرها.', search: 'ابحث في فيديوهاتك', total: 'فيديوهات في مكتبتك', ready: 'جاهزة عند ربط المنصات', connected: 'حسابات متصلة', unavailable: 'لا توجد حسابات متصلة', upcoming: 'فيديوهاتك', all: 'كل الفيديوهات', emptyTitle: 'ابدأ مكتبتك من هنا', emptyBody: 'احفظ فيديو مع عنوانه والمنصات التي تنوي النشر عليها. لن يُنشر أي شيء قبل ربط المنصات الرسمية ومنحها الصلاحيات اللازمة.', emptyAction: 'أضف أول فيديو', noResults: 'لا توجد فيديوهات تطابق البحث.', createTitle: 'أضف إلى مكتبتك', title: 'عنوان الفيديو', titleHint: 'عنوان قصير وواضح', description: 'ملاحظات (اختياري)', platforms: 'المنصات المقصودة', choose: 'اختر منصة واحدة أو أكثر', video: 'ملف الفيديو (اختياري)', drop: 'اختر فيديو من جهازك', fileHint: 'MP4 أو MOV أو WebM · حتى ٥٠ ميجابايت · تخزين خاص', save: 'احفظ الفيديو', saving: 'جارٍ الحفظ…', loading: 'جارٍ تحميل مكتبتك…', retry: 'حاول مرة أخرى', draft: 'محفوظ', cancel: 'إلغاء', saved: 'تم حفظ الفيديو في مكتبتك الخاصة.', removed: 'تم حذف الفيديو.', error: 'حدث خطأ. حاول مرة أخرى.', noPlatforms: 'اختر منصة واحدة على الأقل.', tooLarge: 'اختر فيديو أصغر من ٥٠ ميجابايت.', badFile: 'اختر فيديو بصيغة MP4 أو MOV أو WebM.', signOut: 'تسجيل الخروج', language: 'English', today: 'مساحة عملك', secure: 'خاصة بحسابك', integrationTitle: 'ربط المنصات', integrationBody: 'لا توجد حسابات متصلة. يتطلب النشر صلاحيات OAuth رسمية ومراجعة من كل منصة.', integrationStatus: 'غير متصل', noPublishing: 'النشر والجدولة غير متاحين حالياً', noPublishingBody: 'تحفظ مساحة العمل بيانات الفيديو والملفات الخاصة. يتطلب النشر التلقائي واجهات رسمية وتفويض الحسابات ومهام خلفية موثوقة.', latest: 'أضيفت مؤخراً', delete: 'حذف', deleting: 'جارٍ الحذف…', videoOptional: 'يمكنك إضافة ملف الفيديو الآن أو حفظ التفاصيل أولاً.', calendarEmpty: 'ستظهر الجدولة هنا بعد تنفيذ تكاملات النشر.', month: 'فيديوهاتك المحفوظة', account: 'الحساب', languageLabel: 'اللغة', privateStorage: 'تخزين فيديوهات خاص', privateStorageBody: 'الملفات المرفوعة خاصة ولا يمكن الوصول إليها إلا من حسابك.', allPlatforms: 'اختيار المنصات يسجل فقط وجهات النشر التي تنوي استخدامها.' },
};
const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];

export default function Dashboard() {
  const router = useRouter();
  const [locale, setLocale] = useState<'en' | 'ar'>('ar');
  const [active, setActive] = useState('overview');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [composer, setComposer] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Platform[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const t = copy[locale];
  const ar = locale === 'ar';
  const nav = useMemo(() => [
    { id: 'overview', label: t.overview, Icon: LayoutDashboard }, { id: 'content', label: t.content, Icon: Film },
    { id: 'calendar', label: t.calendar, Icon: CalendarDays }, { id: 'accounts', label: t.accounts, Icon: Link2 }, { id: 'settings', label: t.settings, Icon: Settings2 },
  ], [t]);
  const loadPosts = useCallback(async () => {
    setLoading(true); setLoadError(false);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('video_posts').select('id,title,description,platforms,status,scheduled_at,storage_path,original_filename,created_at').order('created_at', { ascending: false });
      if (error) throw error;
      setPosts((data ?? []) as Post[]);
    } catch { setLoadError(true); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(loadPosts); }, [loadPosts]);
  const filtered = useMemo(() => posts.filter(post => `${post.title} ${post.description ?? ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [posts, query]);

  async function savePost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice('');
    if (!selected.length) { setNotice(t.noPlatforms); return; }
    if (file && !allowedTypes.includes(file.type)) { setNotice(t.badFile); return; }
    if (file && file.size > 50 * 1024 * 1024) { setNotice(t.tooLarge); return; }
    setBusy(true);
    let storagePath: string | null = null;
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Authentication required');
      if (file) {
        const safeName = file.name.normalize('NFKC').replace(/[^\p{L}\p{N}._-]+/gu, '-').slice(-100) || 'video';
        storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await supabase.storage.from('creator-videos').upload(storagePath, file, { contentType: file.type, upsert: false });
        if (error) throw error;
      }
      const { error } = await supabase.from('video_posts').insert({ user_id: user.id, title: title.trim(), description: description.trim() || null, platforms: selected, status: 'draft', storage_path: storagePath, original_filename: file?.name ?? null, mime_type: file?.type ?? null, size_bytes: file?.size ?? null });
      if (error) throw error;
      setComposer(false); setTitle(''); setDescription(''); setSelected([]); setFile(null); setNotice(t.saved); await loadPosts();
    } catch { if (storagePath) { try { await createClient().storage.from('creator-videos').remove([storagePath]); } catch { /* Storage cleanup is best effort; the private prefix remains scoped to the user. */ } } setNotice(t.error); }
    finally { setBusy(false); }
  }
  async function removePost(post: Post) {
    setDeleting(post.id); setNotice('');
    try {
      const supabase = createClient();
      const { error } = await supabase.from('video_posts').delete().eq('id', post.id);
      if (error) throw error;
      if (post.storage_path) { const { error: fileError } = await supabase.storage.from('creator-videos').remove([post.storage_path]); if (fileError) throw fileError; }
      setPosts(current => current.filter(item => item.id !== post.id)); setNotice(t.removed);
    } catch { setNotice(t.error); await loadPosts(); } finally { setDeleting(null); }
  }
  async function signOut() { await createClient().auth.signOut(); router.replace('/login'); }
  const formattedDate = (value: string) => new Intl.DateTimeFormat(ar ? 'ar' : 'en', { dateStyle: 'medium' }).format(new Date(value));

  return <main className={`app-shell ${ar ? 'rtl' : ''}`} dir={ar ? 'rtl' : 'ltr'}>
    <aside className={`sidebar ${mobile ? 'mobile-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Clapperboard size={19}/></span><b>nzlha</b><span className="brand-caption">STUDIO</span><button className="icon-button sidebar-close" aria-label="Close navigation" onClick={() => setMobile(false)}><X size={18}/></button></div>
      <div className="workspace-switch"><span className="workspace-avatar">N</span><span className="workspace-copy"><b>{t.today}</b><small>{t.secure}</small></span><ChevronDown size={16}/></div>
      <p className="nav-heading">{t.workspace}</p>
      <nav aria-label={t.workspace}>{nav.map(({ id, label, Icon }) => <button key={id} className={`nav-item ${active === id ? 'active' : ''}`} aria-current={active === id ? 'page' : undefined} onClick={() => { setActive(id); setMobile(false); }}><Icon size={18}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><ShieldCheck size={17}/><p>{t.privateStorageBody}</p></div><button className="sign-out" onClick={signOut}><LogOut size={17}/>{t.signOut}</button></div>
    </aside>
    {mobile && <button className="scrim" aria-label="Close navigation" onClick={() => setMobile(false)}/>}
    <section className="main-area">
      <header className="topbar"><button className="icon-button mobile-trigger" aria-label="Open navigation" onClick={() => setMobile(true)}><Menu size={19}/></button><div className="breadcrumbs">{t.today}<span>/</span><b>{nav.find(item => item.id === active)?.label}</b></div><div className="top-actions"><label className="search-box"><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder={t.search} aria-label={t.search}/></label><button className="language-button" onClick={() => setLocale(ar ? 'en' : 'ar')}><Globe2 size={16}/>{t.language}</button><span className="user-dot" aria-label={t.account}>N</span></div></header>
      <div className="page-content">
        <div className="page-heading"><div><p className="overline">NZLHA STUDIO <span>·</span> {t.secure}</p><h1>{active === 'overview' ? t.overview : nav.find(item => item.id === active)?.label}</h1><p className="page-subtitle">{t.subtitle}</p></div>{active !== 'accounts' && active !== 'settings' && <button className="primary-button" onClick={() => { setNotice(''); setComposer(true); }}><Plus size={18}/>{t.create}</button>}</div>
        {notice && <div className="notice" role="status">{notice}<button className="icon-button" onClick={() => setNotice('')} aria-label="Dismiss"><X size={15}/></button></div>}
        {active === 'overview' && <><section className="overview-grid"><article className="metric-card"><span className="metric-icon"><Film size={18}/></span><p>{t.total}</p><strong>{loading ? '—' : posts.length}</strong><small>{t.latest}</small></article><article className="metric-card muted-metric"><span className="metric-icon"><CalendarDays size={18}/></span><p>{t.ready}</p><strong>—</strong><small>{t.noPublishing}</small></article><article className="metric-card muted-metric"><span className="metric-icon"><Link2 size={18}/></span><p>{t.connected}</p><strong>0</strong><small>{t.unavailable}</small></article></section>
          <div className="content-grid"><section className="surface library-surface"><div className="section-heading"><div><h2>{t.upcoming}</h2><p>{t.all}</p></div><button className="text-button" onClick={() => setActive('content')}>{t.content} <span>←</span></button></div><PostList posts={filtered.slice(0, 5)} loading={loading} error={loadError} noResults={Boolean(query.trim() && posts.length)} onRetry={loadPosts} onDelete={removePost} deleting={deleting} t={t} formatDate={formattedDate}/></section>
            <section className="surface integration-surface"><span className="feature-icon"><Link2 size={19}/></span><p className="overline">{t.integrationTitle}</p><h2>{t.noPublishing}</h2><p>{t.noPublishingBody}</p><button className="outlined-button" onClick={() => setActive('accounts')}>{t.accounts}<span>←</span></button></section></div>
        </>}
        {active === 'content' && <section className="surface full-surface"><div className="section-heading"><div><h2>{t.all}</h2><p>{posts.length} · {t.drafts}</p></div><FileVideo2 size={19} className="heading-icon"/></div><PostList posts={filtered} loading={loading} error={loadError} noResults={Boolean(query.trim() && posts.length)} onRetry={loadPosts} onDelete={removePost} deleting={deleting} t={t} formatDate={formattedDate}/></section>}
        {active === 'calendar' && <section className="surface full-surface"><div className="section-heading"><div><h2>{t.month}</h2><p>{t.calendar}</p></div><CalendarDays size={19} className="heading-icon"/></div><div className="callout"><Activity size={18}/><p>{t.calendarEmpty}</p></div><PostList posts={filtered} loading={loading} error={loadError} noResults={Boolean(query.trim() && posts.length)} onRetry={loadPosts} onDelete={removePost} deleting={deleting} t={t} formatDate={formattedDate}/></section>}
        {active === 'accounts' && <section className="platform-grid">{platformList.map(({ id, name, Icon }) => <article className="platform-card" key={id}><span className="platform-icon"><Icon size={21}/></span><div><h2>{name}</h2><p>{t.integrationStatus}</p></div><span className="status-pill">{t.integrationStatus}</span><p className="platform-info">{t.integrationBody}</p></article>)}</section>}
        {active === 'settings' && <section className="surface settings-surface"><div className="section-heading"><div><h2>{t.account}</h2><p>{t.privateStorage}</p></div><ShieldCheck size={19} className="heading-icon"/></div><div className="setting-row"><span><b>{t.languageLabel}</b><small>{ar ? 'العربية' : 'English'}</small></span><button className="outlined-button" onClick={() => setLocale(ar ? 'en' : 'ar')}>{t.language}</button></div><div className="setting-row"><span><b>{t.privateStorage}</b><small>{t.privateStorageBody}</small></span><ShieldCheck size={18}/></div></section>}
        <footer className="page-footer"><ShieldCheck size={15}/><span>{t.allPlatforms}</span><i>·</i><span>{t.privateStorage}</span></footer>
      </div>
    </section>
    {composer && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setComposer(false); }}><section className="composer" role="dialog" aria-modal="true" aria-labelledby="composer-title"><div className="composer-header"><div><p className="overline">CONTENT STUDIO</p><h2 id="composer-title">{t.createTitle}</h2></div><button className="icon-button" aria-label={t.cancel} onClick={() => setComposer(false)}><X size={19}/></button></div><form onSubmit={savePost}>
      <label className="form-label">{t.title}<input required maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder={t.titleHint}/></label>
      <label className="form-label">{t.description}<textarea maxLength={2000} rows={3} value={description} onChange={event => setDescription(event.target.value)}/></label>
      <fieldset className="platform-fieldset"><legend>{t.platforms}</legend><p>{t.choose}</p><div className="platform-options">{platformList.map(({ id, name, Icon }) => <button type="button" key={id} aria-pressed={selected.includes(id)} className={`platform-choice ${selected.includes(id) ? 'chosen' : ''}`} onClick={() => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])}><Icon size={17}/>{name}{selected.includes(id) && <Check size={15}/>}</button>)}</div></fieldset>
      <label className="file-picker"><input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={event => setFile(event.target.files?.[0] ?? null)}/><span className="upload-icon"><CloudUpload size={20}/></span><span><b>{file?.name ?? t.drop}</b><small>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : t.fileHint}</small></span><span className="choose-file">{file ? '✓' : '+'}</span></label>
      <p className="form-note"><ShieldCheck size={15}/>{t.videoOptional}</p>{notice && <p className="form-error" role="alert">{notice}</p>}
      <div className="composer-actions"><button type="button" className="cancel-button" onClick={() => setComposer(false)} disabled={busy}>{t.cancel}</button><button className="primary-button" type="submit" disabled={busy}>{busy && <LoaderCircle size={17} className="spin"/>}{busy ? t.saving : t.save}</button></div>
    </form></section></div>}
  </main>;
}

function PostList({ posts, loading, error, noResults, onRetry, onDelete, deleting, t, formatDate }: { posts: Post[]; loading: boolean; error: boolean; noResults: boolean; onRetry: () => void; onDelete: (post: Post) => void; deleting: string | null; t: typeof copy.en; formatDate: (date: string) => string }) {
  if (loading) return <div className="loading-state"><LoaderCircle size={20} className="spin"/><span>{t.loading}</span></div>;
  if (error) return <div className="empty-state compact"><p>{t.error}</p><button className="text-button" onClick={onRetry}>{t.retry}</button></div>;
  if (!posts.length) return <div className="empty-state">{!noResults && <span className="empty-art"><Clapperboard size={22}/></span>}<h3>{noResults ? t.noResults : t.emptyTitle}</h3>{!noResults && <p>{t.emptyBody}</p>}</div>;
  return <div className="post-list">{posts.map(post => <article className="post-row" key={post.id}><span className="post-art"><Film size={18}/></span><span className="post-copy"><b>{post.title}</b><small>{post.platforms.map(platform => platformList.find(item => item.id === platform)?.name ?? platform).join(' · ')} <i>·</i> {formatDate(post.created_at)}</small>{post.original_filename && <small className="file-meta"><FileVideo2 size={13}/>{post.original_filename}</small>}</span><span className="draft-tag">{t.draft}</span><button className="icon-button delete-button" aria-label={`${t.delete}: ${post.title}`} disabled={deleting === post.id} onClick={() => onDelete(post)}>{deleting === post.id ? <LoaderCircle size={16} className="spin"/> : <Trash2 size={16}/>}</button></article>)}</div>;
}
