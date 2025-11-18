import { useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { Heart, MessageCircle, Plus, LogIn, User as UserIcon, Calendar, MapPin, ChevronRight, Loader2 } from 'lucide-react'
import Spline from '@splinetool/react-spline'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('user')
    return s ? JSON.parse(s) : null
  })
  const login = (data) => {
    setToken(data.token)
    setUser({ id: data.user_id, username: data.username })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify({ id: data.user_id, username: data.username }))
  }
  const logout = () => {
    setToken(''); setUser(null); localStorage.removeItem('token'); localStorage.removeItem('user')
  }
  return { token, user, login, logout }
}

function Navbar({ auth }) {
  const location = useLocation()
  return (
    <div className="sticky top-0 z-20 bg-slate-900/70 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 grid place-items-center text-white font-bold">S</div>
          <span className="text-white font-semibold">Soon</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/host" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"><Plus size={16}/> Host a Trip</Link>
          {auth.user ? (
            <Link to={`/u/${auth.user.id}`} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"><UserIcon size={16}/> {auth.user.username}</Link>
          ) : (
            <Link to="/auth" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"><LogIn size={16}/> Sign In</Link>
          )}
        </div>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
      <Spline scene="https://prod.spline.design/qQUip0dJPqrrPryE/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
      <div className="absolute inset-0 flex items-end pb-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow">Travel together, discover more.</h1>
          <p className="mt-3 text-blue-200 max-w-xl">Soon is a vibrant travel community to share inspirations, host trips, and meet fellow explorers.</p>
        </div>
      </div>
    </div>
  )
}

function FeedCard({ post, onLike }) {
  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-2xl overflow-hidden">
      {post.images?.[0] && (
        <img src={post.images[0]} alt="" className="w-full h-60 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden">
            {post.user?.avatar_url ? <img src={post.user.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-white/60">@</div>}
          </div>
          <div>
            <div className="text-white font-medium">{post.user?.username || 'user'}</div>
            {post.location && <div className="text-xs text-blue-200/70 flex items-center gap-1"><MapPin size={12}/> {post.location}</div>}
          </div>
        </div>
        {post.caption && <p className="mt-3 text-blue-100/90">{post.caption}</p>}
        <div className="mt-4 flex items-center justify-between">
          <button onClick={() => onLike(post)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"><Heart size={16}/> {post.likes || 0}</button>
          <Link to={`/post/${post._id}`} className="inline-flex items-center gap-2 text-blue-300 hover:text-white transition"><MessageCircle size={16}/> {post.comments_count || 0} Comments</Link>
        </div>
      </div>
    </div>
  )
}

function useInfiniteFeed() {
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(false)
  const doneRef = useRef(false)

  const load = async () => {
    if (loading || doneRef.current) return
    setLoading(true)
    const res = await fetch(`${API_BASE}/feed${cursor ? `?cursor=${cursor}` : ''}`)
    const data = await res.json()
    setItems(prev => [...prev, ...data.items])
    setCursor(data.nextCursor)
    if (!data.nextCursor) doneRef.current = true
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        load()
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [cursor, loading])

  return { items, load, loading }
}

function Home({ auth }) {
  const { items, loading } = useInfiniteFeed()

  const like = async (post) => {
    if (!auth.token) return alert('Sign in to like posts')
    const res = await fetch(`${API_BASE}/posts/${post._id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${auth.token}` }})
    const data = await res.json()
    post.likes = data.count
  }

  return (
    <div>
      <Hero />
      <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(p => <FeedCard key={p._id} post={p} onLike={like} />)}
      </div>
      {loading && <div className="py-10 text-center text-blue-200 flex items-center gap-2 justify-center"><Loader2 className="animate-spin" size={18}/> Loading...</div>}
    </div>
  )
}

function AuthPage({ auth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try {
      const body = mode === 'login' ? { email, password } : { email, password, username, name }
      const res = await fetch(`${API_BASE}/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Auth failed')
      const data = await res.json()
      auth.login(data)
      nav('/')
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-slate-800/70 border border-white/10 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="text-blue-200/80 text-sm mb-4">Join the Soon community</p>
        {mode === 'signup' && (
          <>
            <label className="block text-sm mt-3">Username</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-blue-500" required/>
            <label className="block text-sm mt-3">Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-blue-500"/>
          </>
        )}
        <label className="block text-sm mt-3">Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-blue-500" required/>
        <label className="block text-sm mt-3">Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-blue-500" required/>
        <button className="w-full mt-5 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition">{mode === 'login' ? 'Sign In' : 'Create Account'}</button>
        <div className="mt-4 text-sm text-blue-200/80 text-center">
          {mode === 'login' ? (
            <>New here? <button type="button" className="underline" onClick={()=>setMode('signup')}>Create an account</button></>
          ) : (
            <>Already have an account? <button type="button" className="underline" onClick={()=>setMode('login')}>Sign in</button></>
          )}
        </div>
      </form>
    </div>
  )
}

function HostTrip({ auth }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ title:'', location:'', description:'', cover_image:'', start_date:'', end_date:'', capacity:'', price:'' })
  const nav = useNavigate()
  const next = () => setStep(s=>Math.min(3, s+1))
  const prev = () => setStep(s=>Math.max(1, s-1))
  const submit = async () => {
    try {
      const payload = { ...form, capacity: form.capacity? Number(form.capacity): null, price: form.price? Number(form.price): null, start_date: form.start_date||null, end_date: form.end_date||null }
      const res = await fetch(`${API_BASE}/trips`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Failed to create trip')
      const t = await res.json()
      nav(`/trip/${t._id}`)
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-white">
      <h2 className="text-3xl font-semibold">Host a Trip</h2>
      <p className="text-blue-200/80">Create a multi-day adventure for the community</p>
      <div className="mt-6 bg-slate-800/70 border border-white/10 rounded-2xl p-6">
        {step===1 && (
          <div>
            <label className="block text-sm">Title</label>
            <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"/>
            <label className="block text-sm mt-4">Location</label>
            <input value={form.location} onChange={e=>setForm({...form, location:e.target.value})} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"/>
            <label className="block text-sm mt-4">Cover Image URL</label>
            <input value={form.cover_image} onChange={e=>setForm({...form, cover_image:e.target.value})} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"/>
          </div>
        )}
        {step===2 && (
          <div>
            <label className="block text-sm">Start Date</label>
            <input type="date" value={form.start_date} onChange={e=>setForm({...form, start_date:e.target.value})} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"/>
            <label className="block text-sm mt-4">End Date</label>
            <input type="date" value={form.end_date} onChange={e=>setForm({...form, end_date:e.target.value})} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"/>
            <label className="block text-sm mt-4">Capacity</label>
            <input type="number" value={form.capacity} onChange={e=>setForm({...form, capacity:e.target.value})} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"/>
            <label className="block text-sm mt-4">Price (optional)</label>
            <input type="number" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"/>
          </div>
        )}
        {step===3 && (
          <div>
            <label className="block text-sm">Description</label>
            <textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} rows={6} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"/>
          </div>
        )}
        <div className="mt-6 flex items-center justify-between">
          <button onClick={prev} disabled={step===1} className="px-3 py-2 rounded-lg bg-white/5 text-white disabled:opacity-50">Back</button>
          {step<3 ? (
            <button onClick={next} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500">Next</button>
          ) : (
            <button onClick={submit} className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500">Create Trip</button>
          )}
        </div>
      </div>
    </div>
  )
}

function TripDetails({ auth }) {
  const [trip, setTrip] = useState(null)
  const id = location.pathname.split('/').pop()
  const join = async () => {
    if (!auth.token) return alert('Sign in to join trips')
    const res = await fetch(`${API_BASE}/trips/${id}/join`, { method: 'POST', headers: { Authorization: `Bearer ${auth.token}` }})
    const data = await res.json(); setTrip(prev => ({ ...prev, is_joined: data.status==='joined', joined_count: (prev?.joined_count||0) + (data.status==='joined'?1:0) }))
  }
  useEffect(() => {
    fetch(`${API_BASE}/trips/${id}`).then(r=>r.json()).then(setTrip)
  }, [id])
  if (!trip) return <div className="py-20 text-center text-blue-200">Loading...</div>
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-white">
      <div className="bg-slate-800/60 border border-white/10 rounded-2xl overflow-hidden">
        {trip.cover_image && <img src={trip.cover_image} className="w-full h-64 object-cover"/>}
        <div className="p-6">
          <h2 className="text-3xl font-semibold">{trip.title}</h2>
          <div className="text-blue-200/80 flex items-center gap-3 mt-1"><MapPin size={16}/> {trip.location}</div>
          <p className="mt-4 text-blue-100/90">{trip.description}</p>
          <div className="mt-4 flex items-center gap-4 text-blue-200/80">
            <div className="inline-flex items-center gap-2"><UserIcon size={16}/> Host: {trip.host?.username}</div>
            <div className="inline-flex items-center gap-2"><Calendar size={16}/> {trip.start_date?.slice(0,10)} → {trip.end_date?.slice(0,10)}</div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button onClick={join} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500">{trip.is_joined ? 'Joined' : 'Join Trip'}</button>
            <div className="text-blue-200/80">{trip.joined_count} going {trip.capacity? `• ${trip.capacity} spots`: ''}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Profile({ auth }) {
  const uid = location.pathname.split('/').pop()
  const [profile, setProfile] = useState(null)
  const [tab, setTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [trips, setTrips] = useState({ hosted: [], joined: [] })
  useEffect(() => {
    fetch(`${API_BASE}/users/${uid}`, { headers: auth.token? { Authorization: `Bearer ${auth.token}` }: {} }).then(r=>r.json()).then(setProfile)
    fetch(`${API_BASE}/users/${uid}/posts`).then(r=>r.json()).then(setPosts)
    fetch(`${API_BASE}/users/${uid}/trips`).then(r=>r.json()).then(setTrips)
  }, [uid])
  const toggleFollow = async () => {
    if (!auth.token) return alert('Sign in to follow users')
    if (profile?.is_following) {
      await fetch(`${API_BASE}/follow/${uid}`, { method: 'DELETE', headers: { Authorization: `Bearer ${auth.token}` } })
      setProfile(p=>({ ...p, is_following: false }))
    } else {
      await fetch(`${API_BASE}/follow/${uid}`, { method: 'POST', headers: { Authorization: `Bearer ${auth.token}` } })
      setProfile(p=>({ ...p, is_following: true }))
    }
  }
  if (!profile) return <div className="py-20 text-center text-blue-200">Loading...</div>
  const u = profile.user
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white">
      <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-white/10 overflow-hidden">
          {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center text-2xl">@</div>}
        </div>
        <div className="flex-1">
          <div className="text-2xl font-semibold">{u.name || u.username}</div>
          <div className="text-blue-200/80">@{u.username}</div>
          {u.bio && <p className="mt-2 text-blue-100/90">{u.bio}</p>}
        </div>
        {auth.user?.id !== uid && (
          <button onClick={toggleFollow} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500">{profile.is_following ? 'Following' : 'Follow'}</button>
        )}
      </div>

      <div className="mt-6 flex items-center gap-4 text-blue-200/80">
        <button onClick={()=>setTab('posts')} className={`px-3 py-1.5 rounded-lg ${tab==='posts'?'bg-white/10 text-white':''}`}>Posts/Inspirations</button>
        <button onClick={()=>setTab('trips')} className={`px-3 py-1.5 rounded-lg ${tab==='trips'?'bg-white/10 text-white':''}`}>Hosted/Joined Trips</button>
      </div>

      {tab==='posts' ? (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {posts.map(p => (
            <div key={p._id} className="aspect-square rounded-xl overflow-hidden">
              {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-white/5 grid place-items-center text-blue-200">No Image</div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {trips.hosted.map(t => (
            <Link key={t._id} to={`/trip/${t._id}`} className="bg-slate-800/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-white font-medium">{t.title}</div>
                <div className="text-blue-200/80 text-sm flex items-center gap-2"><MapPin size={14}/> {t.location}</div>
              </div>
              <ChevronRight />
            </Link>
          ))}
          {trips.joined.map(t => (
            <Link key={t._id} to={`/trip/${t._id}`} className="bg-slate-800/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-white font-medium">{t.title}</div>
                <div className="text-blue-200/80 text-sm flex items-center gap-2"><MapPin size={14}/> {t.location}</div>
              </div>
              <ChevronRight />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Layout() {
  const auth = useAuth()
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Navbar auth={auth} />
      <Routes>
        <Route path="/" element={<Home auth={auth} />} />
        <Route path="/auth" element={<AuthPage auth={auth} />} />
        <Route path="/host" element={<HostTrip auth={auth} />} />
        <Route path="/trip/:id" element={<TripDetails auth={auth} />} />
        <Route path="/u/:id" element={<Profile auth={auth} />} />
      </Routes>
      <footer className="border-t border-white/10 py-10 text-center text-blue-200/70">© {new Date().getFullYear()} Soon</footer>
    </div>
  )
}

export default function AppWrapper() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
