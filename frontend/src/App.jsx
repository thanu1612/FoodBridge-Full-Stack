import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const API = 'http://localhost:5000/api'

const STATUS_STEPS = [
  { key: 'Requested', label: 'Requested' },
  { key: 'Volunteer Assigned', label: 'Assigned' },
  { key: 'Picked Up', label: 'Picked Up' },
  { key: 'On the Way', label: 'On the Way' },
  { key: 'Delivered', label: 'Delivered' }
]

const STATUS_META = {
  Available: { label: 'Available', tone: 'available', icon: '●' },
  Requested: { label: 'Requested', tone: 'requested', icon: '○' },
  'Volunteer Assigned': { label: 'Assigned', tone: 'assigned', icon: '●' },
  'Picked Up': { label: 'Picked Up', tone: 'picked', icon: '◆' },
  'On the Way': { label: 'On the Way', tone: 'transit', icon: '➜' },
  Delivered: { label: 'Delivered', tone: 'delivered', icon: '✓' }
}

const ROLE_META = {
  donor: { label: 'Food Donor', short: 'Donor', icon: 'box', description: 'Share surplus food and follow every delivery stage.' },
  ngo: { label: 'NGO', short: 'NGO', icon: 'heart', description: 'Find suitable food, request donations and track deliveries.' },
  volunteer: { label: 'Volunteer', short: 'Volunteer', icon: 'truck', description: 'Manage pickups and keep delivery progress updated.' },
  admin: { label: 'Admin', short: 'Admin', icon: 'shield', description: 'Coordinate requests, volunteers and the full delivery network.' }
}

function Icon({ name, size = 20, strokeWidth = 1.9 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    box: <><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v9l9 5 9-5V8M12 13v9"/></>,
    truck: <><path d="M3 6h11v11H3z"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,
    heart: <path d="M20.8 8.8c0 5.5-8.8 10.4-8.8 10.4S3.2 14.3 3.2 8.8A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.8 2.6Z"/>,
    shield: <><path d="M12 3 20 6v6c0 5-3.3 8-8 9-4.7-1-8-4-8-9V6l8-3Z"/><path d="m8.5 12 2.3 2.3 4.8-5"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    filter: <path d="M4 5h16M7 12h10M10 19h4"/>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    chevron: <path d="m7 10 5 5 5-5"/>,
    back: <><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.8-3L3 11"/><path d="M3 6v5h5"/><path d="M4 13a8 8 0 0 0 14.8 3L21 13"/><path d="M21 18v-5h-5"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/></>,
    edit: <><path d="m4 16-.8 4.8L8 20l11.5-11.5a2.1 2.1 0 0 0-3-3L5 17Z"/><path d="m14.5 6.5 3 3"/></>,
    eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
    eyeOff: <><path d="M3 3l18 18"/><path d="M10.6 5.7A10.8 10.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a18 18 0 0 1-3.2 3.7M6.2 6.3C3.8 8 2.5 12 2.5 12S6 18.5 12 18.5a9.5 9.5 0 0 0 3.4-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M8 9h8M8 13h6M8 17h4"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 20c.4-3.3 2.4-5 6-5s5.6 1.7 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 15c2.8.1 4.5 1.6 5 4"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><rect x="7" y="12" width="3" height="5" rx=".5"/><rect x="12" y="9" width="3" height="8" rx=".5"/><rect x="17" y="6" width="3" height="11" rx=".5"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    leaf: <><path d="M20 4C10 4 5 7 5 14c0 4 3 6 6 6 7 0 9-7 9-16Z"/><path d="M5 20c2-5 6-8 11-10"/></>,
    spark: <><path d="m12 3 1.3 5.2L18 10l-4.7 1.8L12 17l-1.3-5.2L6 10l4.7-1.8L12 3Z"/><path d="m19 15 .6 2.4L22 18l-2.4.6L19 21l-.6-2.4L16 18l2.4-.6L19 15Z"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.info}</svg>
}

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('foodbridgeUser') || 'null') } catch { return null }
  })
  const [section, setSection] = useState('overview')
  const [mobileNav, setMobileNav] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('foodbridgeTheme') || 'light')
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('foodbridgeCompact') === 'true')
  const [readNotifications, setReadNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('foodbridgeReadNotifications') || '[]') } catch { return [] }
  })
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  const [login, setLogin] = useState({ email: '', password: '' })
  const [register, setRegister] = useState({ name: '', email: '', password: '', role: '' })
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [authMessage, setAuthMessage] = useState('')

  const [donations, setDonations] = useState([])
  const [availableFood, setAvailableFood] = useState([])
  const [requests, setRequests] = useState([])
  const [tasks, setTasks] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [allRequests, setAllRequests] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [summary, setSummary] = useState(null)

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionId, setActionId] = useState('')
  const [donationForm, setDonationForm] = useState({ foodName: '', quantity: '', foodType: '', pickupLocation: '', availableUntil: '', description: '' })
  const [showDonationForm, setShowDonationForm] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileEdit, setProfileEdit] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [foodFilter, setFoodFilter] = useState('All')
  const [volunteerFilter, setVolunteerFilter] = useState('All')
  const [sort, setSort] = useState('Newest')

  const clearMessages = () => { setError(''); setSuccess('') }

  const api = async (path, options = {}) => {
    try {
      const response = await fetch(`${API}${path}`, options)
      let data = {}
      try { data = await response.json() } catch { data = {} }
      if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`)
      return data
    } catch (err) {
      if (err instanceof TypeError) throw new Error('FoodBridge server is not reachable. Please start the backend on port 5000.')
      throw err
    }
  }

  const loadData = async (showSpinner = true) => {
    if (!user) return
    if (showSpinner) setPageLoading(true)
    setError('')
    try {
      if (user.role === 'donor') {
        setDonations(await api(`/donations?donorEmail=${encodeURIComponent(user.email)}`))
      } else if (user.role === 'ngo') {
        const [available, mine] = await Promise.all([
          api('/donations/available'),
          api(`/requests?ngoEmail=${encodeURIComponent(user.email)}`)
        ])
        setAvailableFood(available)
        setRequests(mine)
      } else if (user.role === 'volunteer') {
        setTasks(await api(`/tasks?volunteerEmail=${encodeURIComponent(user.email)}`))
      } else if (user.role === 'admin') {
        const [pending, all, vols, stats] = await Promise.all([
          api('/requests/pending'), api('/requests/all'), api('/volunteers'), api('/admin/summary')
        ])
        setPendingRequests(pending)
        setAllRequests(all)
        setVolunteers(vols)
        setSummary(stats)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      if (showSpinner) setPageLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    localStorage.setItem('foodbridgeUser', JSON.stringify(user))
    loadData(true)
    const timer = setInterval(() => loadData(false), 15000)
    return () => clearInterval(timer)
  }, [user])

  useEffect(() => {
    localStorage.setItem('foodbridgeReadNotifications', JSON.stringify(readNotifications))
  }, [readNotifications])

  useEffect(() => {
    localStorage.setItem('foodbridgeTheme', theme)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      document.documentElement.dataset.fbResolvedTheme =
        theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
    }
    applyTheme()
    media.addEventListener?.('change', applyTheme)
    return () => media.removeEventListener?.('change', applyTheme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('foodbridgeCompact', String(compactMode))
    document.documentElement.dataset.fbCompact = compactMode ? 'true' : 'false'
  }, [compactMode])

  useEffect(() => {
    if (currentPage !== 'dashboard') {
      setNotificationOpen(false)
      setProfileMenuOpen(false)
    }
  }, [currentPage])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setNotificationOpen(false)
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const loginSubmit = async (event) => {
    event.preventDefault(); clearMessages(); setLoginError(''); setAuthMessage('')
    if (!login.email.trim() || !login.password) return setLoginError('Please enter your email and password.')
    setLoading(true)
    try {
      const data = await api('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(login) })
      setUser(data.user); setCurrentPage('dashboard'); setSection('overview'); setLogin({ email: '', password: '' }); setReadNotifications([])
    } catch (err) { setLoginError(err.message) } finally { setLoading(false) }
  }

  const registerSubmit = async (event) => {
    event.preventDefault(); clearMessages(); setRegisterError(''); setAuthMessage('')
    const { name, email, password, role } = register
    if (!name.trim() || !email.trim() || !password || !role) return setRegisterError('Please complete every field.')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setRegisterError('Please enter a valid email address.')
    if (password.length < 6) return setRegisterError('Password must contain at least 6 characters.')
    setLoading(true)
    try {
      const data = await api('/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(register) })
      setAuthMessage(data.message); setRegister({ name: '', email: '', password: '', role: '' })
    } catch (err) { setRegisterError(err.message) } finally { setLoading(false) }
  }

  const logout = () => {
    localStorage.removeItem('foodbridgeUser')
    setUser(null); setCurrentPage('home'); setSection('overview'); setNotificationOpen(false); setProfileMenuOpen(false); clearMessages()
  }

  const go = (nextSection) => {
    clearMessages(); setSection(nextSection); setMobileNav(false); setNotificationOpen(false); setProfileMenuOpen(false); setSearch(''); setStatusFilter('All'); setFoodFilter('All'); setVolunteerFilter('All'); setSort('Newest')
    if (nextSection === 'donations') setShowDonationForm(true); else setShowDonationForm(false)
  }

  const submitDonation = async (event) => {
    event.preventDefault(); clearMessages()
    const required = ['foodName', 'quantity', 'foodType', 'pickupLocation', 'availableUntil']
    if (required.some((key) => !String(donationForm[key]).trim())) return setError('Please fill all required donation details.')
    if (new Date(donationForm.availableUntil) <= new Date()) return setError('Available until must be a future date and time.')
    setLoading(true)
    try {
      const data = await api('/donations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...donationForm, donorName: user.name, donorEmail: user.email }) })
      setSuccess(data.message); setDonationForm({ foodName: '', quantity: '', foodType: '', pickupLocation: '', availableUntil: '', description: '' }); setShowDonationForm(false); await loadData(false)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const requestFood = async (item) => {
    clearMessages(); setActionId(item._id)
    try {
      const data = await api('/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ donationId: item._id, ngoName: user.name, ngoEmail: user.email }) })
      setSuccess(data.message); await loadData(false)
    } catch (err) { setError(err.message) } finally { setActionId('') }
  }

  const assign = async (request, volunteerEmail) => {
    if (!volunteerEmail) return
    const volunteer = volunteers.find((item) => item.email === volunteerEmail)
    if (!volunteer) return
    clearMessages(); setActionId(request._id)
    try {
      const data = await api('/requests/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: request._id, volunteerName: volunteer.name, volunteerEmail: volunteer.email }) })
      setSuccess(data.message); await loadData(false)
    } catch (err) { setError(err.message) } finally { setActionId('') }
  }

  const updateStatus = async (task, nextStatus) => {
    clearMessages(); setActionId(task._id)
    try {
      const data = await api('/tasks/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: task._id, volunteerEmail: user.email, status: nextStatus }) })
      setSuccess(data.message); await loadData(false)
    } catch (err) { setError(err.message) } finally { setActionId('') }
  }

  const updateProfile = async (event) => {
    event.preventDefault(); clearMessages()
    if (!profileName.trim()) return setError('Name cannot be empty.')
    setLoading(true)
    try {
      const data = await api('/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, name: profileName.trim() }) })
      setUser(data.user); setProfileEdit(false); setSuccess(data.message)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const recordsForActivity = user?.role === 'donor' ? donations : user?.role === 'ngo' ? requests : user?.role === 'volunteer' ? tasks : allRequests
  const notifications = useMemo(() => {
    if (!user) return []
    const events = []
    recordsForActivity.forEach((record) => {
      const history = Array.isArray(record.statusHistory) && record.statusHistory.length
        ? record.statusHistory
        : [{ status: record.status, updatedAt: record.statusUpdatedAt || record.assignedAt || record.requestedAt || record.createdAt }]
      history.forEach((event, index) => {
        if (!event.status) return
        const id = `${record._id}-${event.status}-${event.updatedAt || index}`
        let title = `${record.foodName || 'Food request'} • ${event.status}`
        let detail = ''
        if (user.role === 'donor') detail = `NGO: ${record.requestedByNgo || 'Waiting for request'}`
        if (user.role === 'ngo') detail = `Volunteer: ${record.volunteerName || 'Waiting for assignment'}`
        if (user.role === 'volunteer') detail = `Pickup: ${record.pickupLocation || 'Pickup location'}`
        if (user.role === 'admin') detail = `${record.ngoName || 'NGO'} • ${record.volunteerName || 'Unassigned'}`
        events.push({ id, title, detail, status: event.status, time: event.updatedAt })
      })
    })
    if (user.role === 'admin') {
      pendingRequests.forEach((record) => events.push({ id: `pending-${record._id}`, title: 'New request needs assignment', detail: `${record.foodName} • ${record.ngoName}`, status: 'Requested', time: record.requestedAt }))
    }
    return events.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)).slice(0, 20)
  }, [user, recordsForActivity, pendingRequests])

  const unread = notifications.filter((item) => !readNotifications.includes(item.id))

  const markAllRead = () => setReadNotifications(notifications.map((item) => item.id))
  const markRead = (id) => setReadNotifications((old) => old.includes(id) ? old : [...old, id])

  const foodTypes = useMemo(() => {
    const source = user?.role === 'ngo' ? availableFood : user?.role === 'donor' ? donations : user?.role === 'admin' ? allRequests : tasks
    return [...new Set(source.map((item) => item.foodType).filter(Boolean))].sort()
  }, [user, availableFood, donations, allRequests, tasks])

  const matches = (item) => {
    const haystack = [item.foodName, item.foodType, item.quantity, item.pickupLocation, item.donorName, item.ngoName, item.volunteerName].filter(Boolean).join(' ').toLowerCase()
    if (search && !haystack.includes(search.toLowerCase())) return false
    if (statusFilter !== 'All' && item.status !== statusFilter) return false
    if (foodFilter !== 'All' && item.foodType !== foodFilter) return false
    if (user?.role === 'admin' && volunteerFilter !== 'All' && item.volunteerEmail !== volunteerFilter) return false
    return true
  }

  const sortRecords = (list) => [...list].sort((a, b) => {
    if (sort === 'Status') return String(a.status).localeCompare(String(b.status))
    const aDate = new Date(a.createdAt || a.requestedAt || a.assignedAt || a.statusUpdatedAt || 0)
    const bDate = new Date(b.createdAt || b.requestedAt || b.assignedAt || b.statusUpdatedAt || 0)
    return sort === 'Oldest' ? aDate - bDate : bDate - aDate
  })

  const filteredDonations = useMemo(() => sortRecords(donations.filter(matches)), [donations, search, statusFilter, foodFilter, sort])
  const filteredAvailable = useMemo(() => sortRecords(availableFood.filter(matches)), [availableFood, search, foodFilter, sort])
  const filteredRequests = useMemo(() => sortRecords(requests.filter(matches)), [requests, search, statusFilter, foodFilter, sort])
  const filteredTasks = useMemo(() => sortRecords(tasks.filter(matches)), [tasks, search, statusFilter, foodFilter, sort])
  const filteredAdmin = useMemo(() => sortRecords(allRequests.filter(matches)), [allRequests, search, statusFilter, foodFilter, volunteerFilter, sort])

  const stats = useMemo(() => {
    if (!user) return []
    if (user.role === 'donor') return [
      { label: 'Total Donations', value: donations.length, icon: 'box', tone: 'green' },
      { label: 'Active Deliveries', value: donations.filter((x) => x.status && x.status !== 'Delivered' && x.status !== 'Available').length, icon: 'truck', tone: 'orange' },
      { label: 'Delivered', value: donations.filter((x) => x.status === 'Delivered').length, icon: 'check', tone: 'blue' },
      { label: 'Available', value: donations.filter((x) => x.status === 'Available').length, icon: 'leaf', tone: 'teal' }
    ]
    if (user.role === 'ngo') return [
      { label: 'Available Food', value: availableFood.length, icon: 'box', tone: 'teal' },
      { label: 'My Requests', value: requests.length, icon: 'clipboard', tone: 'purple' },
      { label: 'In Progress', value: requests.filter((x) => !['Requested', 'Delivered'].includes(x.status)).length, icon: 'truck', tone: 'orange' },
      { label: 'Delivered', value: requests.filter((x) => x.status === 'Delivered').length, icon: 'check', tone: 'blue' }
    ]
    if (user.role === 'volunteer') return [
      { label: 'Assigned', value: tasks.filter((x) => x.status === 'Volunteer Assigned').length, icon: 'user', tone: 'purple' },
      { label: 'Picked Up', value: tasks.filter((x) => x.status === 'Picked Up').length, icon: 'box', tone: 'blue' },
      { label: 'On the Way', value: tasks.filter((x) => x.status === 'On the Way').length, icon: 'truck', tone: 'orange' },
      { label: 'Delivered', value: tasks.filter((x) => x.status === 'Delivered').length, icon: 'check', tone: 'green' }
    ]
    return [
      { label: 'Registered Users', value: summary?.users ?? 0, icon: 'users', tone: 'purple' },
      { label: 'Total Requests', value: summary?.requests ?? allRequests.length, icon: 'clipboard', tone: 'blue' },
      { label: 'Pending Assignment', value: pendingRequests.length, icon: 'clock', tone: 'orange' },
      { label: 'In Progress', value: summary?.active ?? allRequests.filter((x) => ['Volunteer Assigned', 'Picked Up', 'On the Way'].includes(x.status)).length, icon: 'truck', tone: 'teal' },
      { label: 'Delivered', value: summary?.delivered ?? allRequests.filter((x) => x.status === 'Delivered').length, icon: 'check', tone: 'green' }
    ]
  }, [user, donations, availableFood, requests, tasks, allRequests, pendingRequests, summary])

  const resetFilters = () => { setSearch(''); setStatusFilter('All'); setFoodFilter('All'); setVolunteerFilter('All'); setSort('Newest') }

  if (currentPage === 'home') return <Home onLogin={() => { setCurrentPage('login'); setLoginError(''); setAuthMessage('') }} onRegister={() => { setCurrentPage('register'); setRegisterError(''); setAuthMessage('') }} onAbout={() => setCurrentPage('about')} />
  if (currentPage === 'about') return <About onBack={() => setCurrentPage('home')} onRegister={() => setCurrentPage('register')} />
  if (currentPage === 'login') return <Auth mode="login" data={login} setData={setLogin} error={loginError} message={authMessage} loading={loading} showPassword={showLoginPassword} setShowPassword={setShowLoginPassword} onSubmit={loginSubmit} onBack={() => setCurrentPage('home')} onSwitch={() => { setCurrentPage('register'); setLoginError('') }} />
  if (currentPage === 'register') return <Auth mode="register" data={register} setData={setRegister} error={registerError} message={authMessage} loading={loading} showPassword={showRegisterPassword} setShowPassword={setShowRegisterPassword} onSubmit={registerSubmit} onBack={() => setCurrentPage('home')} onSwitch={() => { setCurrentPage('login'); setRegisterError('') }} />
  if (!user) return <Home onLogin={() => setCurrentPage('login')} onRegister={() => setCurrentPage('register')} onAbout={() => setCurrentPage('about')} />

  const navItems = user.role === 'donor'
    ? [{ id: 'overview', label: 'Overview', icon: 'grid' }, { id: 'donations', label: 'Add Donation', icon: 'plus' }, { id: 'my-donations', label: 'My Donations', icon: 'box' }, { id: 'tracking', label: 'Donation Tracking', icon: 'truck' }]
    : user.role === 'ngo'
      ? [{ id: 'overview', label: 'Overview', icon: 'grid' }, { id: 'available', label: 'Available Food', icon: 'box' }, { id: 'requests', label: 'My Requests', icon: 'clipboard' }, { id: 'tracking', label: 'Request Tracking', icon: 'truck' }]
      : user.role === 'volunteer'
        ? [{ id: 'overview', label: 'Overview', icon: 'grid' }, { id: 'tasks', label: 'Assigned Tasks', icon: 'clipboard' }, { id: 'pickup', label: 'Pickup Details', icon: 'location' }, { id: 'delivery', label: 'Delivery Status', icon: 'truck' }]
        : [{ id: 'overview', label: 'Overview', icon: 'grid' }, { id: 'assignments', label: 'Assign Volunteers', icon: 'users' }, { id: 'admin-tracking', label: 'Monitor Deliveries', icon: 'chart' }]

  return (
    <div className="fb-shell">
      <header className="fb-topbar">
        <div className="fb-topbar-left">
          <button className="fb-mobile-menu" onClick={() => setMobileNav((x) => !x)} aria-label="Open menu"><Icon name="menu"/></button>
          <button className="fb-brand" onClick={() => go('overview')}><span className="brand-mark"><Icon name="leaf" size={17}/></span>Food<span>Bridge</span></button>
        </div>
        <div className="fb-topbar-right">
          <div className="fb-notification-wrap" ref={notificationRef}>
            <button className={`fb-icon-btn ${unread.length ? 'has-alert' : ''}`} onClick={() => { setNotificationOpen((x) => !x); setProfileMenuOpen(false) }} aria-label="Notifications" aria-expanded={notificationOpen}>
              <Icon name="bell" size={21}/>{unread.length > 0 && <span className="fb-notification-badge">{unread.length > 9 ? '9+' : unread.length}</span>}
            </button>
            {notificationOpen && <NotificationPanel notifications={notifications} unread={unread} onMarkRead={markRead} onMarkAll={markAllRead}/>}
          </div>
          <div className="fb-profile-wrap" ref={profileRef}>
            <button className="fb-user-menu" onClick={() => { setProfileMenuOpen((x) => !x); setNotificationOpen(false) }} aria-expanded={profileMenuOpen}>
              <div className="fb-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div className="fb-user-copy"><strong>{user.name}</strong><span>{ROLE_META[user.role].label}</span></div>
              <span className={`fb-chevron ${profileMenuOpen ? 'open' : ''}`}><Icon name="chevron" size={16}/></span>
            </button>
            {profileMenuOpen && <ProfileMenu user={user} onProfile={() => { setProfileName(user.name); go('profile') }} onSettings={() => { setProfileEdit(false); go('settings') }} onLogout={logout}/>}
          </div>
        </div>
      </header>

      <div className="fb-layout">
        <aside className={`fb-sidebar ${mobileNav ? 'open' : ''}`}>
          <div className="fb-sidebar-role"><div className="fb-role-icon"><Icon name={ROLE_META[user.role].icon}/></div><div><strong>{ROLE_META[user.role].label}</strong><span>Workspace</span></div></div>
          <div className="fb-nav-label">WORKSPACE</div>
          <nav>{navItems.map((item) => <NavItem key={item.id} active={section === item.id} item={item} onClick={() => go(item.id)} badge={item.id === 'assignments' ? pendingRequests.length : item.id === 'delivery' ? tasks.filter((x) => x.status !== 'Delivered').length : 0}/>)}</nav>
          <div className="fb-sidebar-footer"><div className="fb-footer-icon"><Icon name="shield" size={15}/></div><div><strong>FoodBridge</strong><span>Food redistribution platform</span></div></div>
        </aside>

        <main className="fb-main">
          <div className="fb-main-inner">
            {error && <Alert type="error" text={error} onClose={() => setError('')}/>} 
            {success && <Alert type="success" text={success} onClose={() => setSuccess('')}/>} 
            {pageLoading ? <LoadingPage/> : <DashboardContent user={user} section={section} go={go} stats={stats} notifications={notifications} donations={filteredDonations} availableFood={filteredAvailable} requests={filteredRequests} tasks={filteredTasks} pendingRequests={pendingRequests} allRequests={filteredAdmin} volunteers={volunteers} summary={summary} search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} foodFilter={foodFilter} setFoodFilter={setFoodFilter} volunteerFilter={volunteerFilter} setVolunteerFilter={setVolunteerFilter} sort={sort} setSort={setSort} foodTypes={foodTypes} resetFilters={resetFilters} showDonationForm={showDonationForm} setShowDonationForm={setShowDonationForm} donationForm={donationForm} setDonationForm={setDonationForm} submitDonation={submitDonation} requestFood={requestFood} requestingId={actionId} assign={assign} assigningId={actionId} updateStatus={updateStatus} updatingId={actionId} profileName={profileName} setProfileName={setProfileName} profileEdit={profileEdit} setProfileEdit={setProfileEdit} updateProfile={updateProfile} loading={loading} theme={theme} setTheme={setTheme} compactMode={compactMode} setCompactMode={setCompactMode} setReadNotifications={setReadNotifications}/>} 
          </div>
        </main>
      </div>
    </div>
  )
}

function DashboardContent(props) {
  const { user, section, go } = props
  if (section === 'overview') return <Overview {...props}/>
  if (user.role === 'donor' && section === 'donations') return <AddDonationPage {...props}/>
  if (user.role === 'donor' && section === 'my-donations') return <DonationsPage {...props}/>
  if (user.role === 'donor' && section === 'tracking') return <TrackingPage {...props} role="donor"/>
  if (user.role === 'ngo' && section === 'available') return <AvailableFoodPage {...props}/>
  if (user.role === 'ngo' && section === 'requests') return <RequestsPage {...props}/>
  if (user.role === 'ngo' && section === 'tracking') return <TrackingPage {...props} role="ngo"/>
  if (user.role === 'volunteer' && section === 'tasks') return <VolunteerTasksPage {...props}/>
  if (user.role === 'volunteer' && section === 'pickup') return <PickupPage {...props}/>
  if (user.role === 'volunteer' && section === 'delivery') return <DeliveryPage {...props}/>
  if (user.role === 'admin' && section === 'assignments') return <AdminAssignmentsPage {...props}/>
  if (user.role === 'admin' && section === 'admin-tracking') return <AdminTrackingPage {...props}/>
  if (section === 'profile') return <ProfilePage {...props}/>
  if (section === 'settings') return <SettingsPage {...props}/>
  return <Overview {...props}/>
}

function Overview({ user, go, stats, notifications }) {
  const role = ROLE_META[user.role]
  const activity = notifications.slice(0, 6)
  return <>
    <PageHeader eyebrow="DASHBOARD" title={`Good ${getTimeGreeting()}, ${user.name.split(' ')[0]}`} subtitle={role.description} action={<button className="fb-primary-btn" onClick={() => go(primarySection(user.role))}>{primaryLabel(user.role)} <Icon name="arrow" size={17}/></button>}/>
    <div className="fb-stat-grid">{stats.map((stat) => <StatCard key={stat.label} {...stat}/>)}</div>
    <div className="fb-overview-grid">
      <section className="fb-panel fb-activity-panel"><PanelHeading eyebrow="LIVE ACTIVITY" title="Recent Activity" action={activity.length ? <button className="fb-text-btn" onClick={() => go(user.role === 'volunteer' ? 'delivery' : user.role === 'admin' ? 'admin-tracking' : 'tracking')}>View all <Icon name="arrow" size={14}/></button> : null}/>{activity.length === 0 ? <EmptyState compact icon="spark" title="Your activity will appear here" text="Create a donation, request food or update a delivery to start building your activity timeline."/> : <div className="fb-activity-list">{activity.map((item) => <ActivityRow key={item.id} item={item}/>)}</div>}</section>
      <section className="fb-panel"><PanelHeading eyebrow="QUICK ACTIONS" title="What would you like to do?"/><div className="fb-quick-list">{quickActions(user.role).map((item) => <button className="fb-quick-action" key={item.id} onClick={() => go(item.id)}><span className={`fb-quick-icon ${item.tone}`}><Icon name={item.icon} size={19}/></span><span className="fb-quick-copy"><strong>{item.label}</strong><small>{item.text}</small></span><Icon name="arrow" size={17}/></button>)}</div></section>
    </div>
  </>
}

function AddDonationPage({ ...props }) {
  return <>
    <PageHeader
      eyebrow="DONOR WORKSPACE"
      title="Add Donation"
      subtitle="Share surplus food with complete pickup details so an NGO and volunteer can coordinate it."
    />
    {props.success && <Alert type="success" text={props.success} onClose={() => {}}/>}
    <DonationForm {...props} onCancel={() => props.go('my-donations')}/>
    <section className="fb-help-strip">
      <div className="fb-help-icon"><Icon name="shield" size={18}/></div>
      <div><strong>Good donation details make pickup easier.</strong><span>Include the food type, quantity, pickup location and availability time.</span></div>
    </section>
  </>
}

function DonationsPage({ user, donations, ...props }) {
  return <>
    <PageHeader eyebrow="DONOR WORKSPACE" title="My Donations" subtitle="Create and manage surplus food donations, then follow their journey." action={<button className="fb-primary-btn" onClick={() => props.setShowDonationForm(true)}><Icon name="plus" size={17}/> Add Donation</button>}/>
    {props.showDonationForm && <DonationForm {...props} onCancel={() => props.setShowDonationForm(false)}/>} 
    <FilterBar {...props} placeholder="Search food, donor, location..." showFoodType={false}/>
    {donations.length === 0 ? <EmptyState icon="box" title="No donations found" text="Your food donations will appear here after you create them." action={<button className="fb-primary-btn" onClick={() => props.setShowDonationForm(true)}><Icon name="plus" size={17}/> Add Donation</button>}/> : <div className="fb-card-grid">{donations.map((item) => <DonationCard key={item._id} item={item} onTrack={() => props.go('tracking')}/>)}</div>}
  </>
}

function DonationForm({ donationForm, setDonationForm, submitDonation, loading, onCancel }) {
  const field = (label, key, placeholder, type = 'text') => <div className={key === 'description' ? 'fb-field full' : 'fb-field'}><label>{label}{key !== 'description' && <span>*</span>}</label>{key === 'description' ? <textarea value={donationForm[key]} onChange={(e) => setDonationForm({ ...donationForm, [key]: e.target.value })} placeholder={placeholder}/> : <input required={key !== 'description'} type={type} value={donationForm[key]} onChange={(e) => setDonationForm({ ...donationForm, [key]: e.target.value })} placeholder={placeholder}/>}</div>
  return <section className="fb-form-card"><div className="fb-form-heading"><div><div className="fb-eyebrow">NEW DONATION</div><h2>Share surplus food</h2><p>Provide enough detail for an NGO and volunteer to coordinate the pickup.</p></div><button className="fb-icon-btn" onClick={onCancel}><Icon name="close"/></button></div><form onSubmit={submitDonation}><div className="fb-form-grid">{field('Food name', 'foodName', 'e.g. Vegetable Rice')}{field('Quantity', 'quantity', 'e.g. 20 portions')}{field('Food type', 'foodType', 'e.g. Vegetarian')}{field('Pickup location', 'pickupLocation', 'e.g. Gudiyatham')}{field('Available until', 'availableUntil', '', 'datetime-local')}{field('Description', 'description', 'Add useful details such as packing, freshness or handling instructions.')}</div><div className="fb-form-actions"><button type="button" className="fb-secondary-btn" onClick={onCancel}>Cancel</button><button disabled={loading} className="fb-primary-btn" type="submit">{loading ? 'Submitting...' : 'Submit Donation'} <Icon name="arrow" size={17}/></button></div></form></section>
}

function DonationCard({ item, onTrack }) {
  return <article className="fb-data-card"><div className="fb-card-top"><div className="fb-food-avatar"><Icon name="box"/></div><div className="fb-card-title"><div className="fb-eyebrow">FOOD DONATION</div><h3>{item.foodName}</h3><p>{item.quantity} <span>•</span> {item.foodType}</p></div><StatusBadge status={item.status}/></div><div className="fb-info-grid"><Info label="Pickup location" value={item.pickupLocation} icon="location"/><Info label="Available until" value={formatDate(item.availableUntil)} icon="calendar"/><Info label="NGO" value={item.requestedByNgo || 'Waiting for request'} icon="heart"/><Info label="Volunteer" value={item.volunteerName || 'Not assigned'} icon="user"/></div>{item.status && item.status !== 'Available' && <StatusTimeline record={item} compact/>}<div className="fb-card-footer"><span>{item.description || 'Surplus food donation'}</span><button className="fb-outline-btn" onClick={onTrack}>View tracking <Icon name="arrow" size={14}/></button></div></article>
}

function AvailableFoodPage({ availableFood, requestFood, requestingId, ...props }) {
  return <><PageHeader eyebrow="NGO WORKSPACE" title="Available Food" subtitle="Browse current surplus donations and request food for your organization."/><FilterBar {...props} placeholder="Search food, donor or location..." showStatus={false} showFoodType/>{availableFood.length === 0 ? <EmptyState icon="box" title="No food available right now" text="New donor submissions will appear here as they become available."/> : <div className="fb-card-grid">{availableFood.map((item) => <article className="fb-data-card food-offer" key={item._id}><div className="fb-card-top"><div className="fb-food-avatar warm"><Icon name="box"/></div><div className="fb-card-title"><div className="fb-eyebrow">AVAILABLE DONATION</div><h3>{item.foodName}</h3><p>{item.quantity} <span>•</span> {item.foodType}</p></div><StatusBadge status="Available"/></div><div className="fb-offer-description">{item.description || 'Fresh surplus food available for redistribution.'}</div><div className="fb-info-grid"><Info label="Donor" value={item.donorName} icon="user"/><Info label="Pickup" value={item.pickupLocation} icon="location"/><Info label="Available until" value={formatDate(item.availableUntil)} icon="clock"/></div><button disabled={requestingId === item._id} className="fb-primary-btn full-btn" onClick={() => requestFood(item)}>{requestingId === item._id ? 'Requesting...' : 'Request Food'} <Icon name="arrow" size={17}/></button></article>)}</div>}</>
}

function RequestsPage({ requests, ...props }) {
  return <><PageHeader eyebrow="NGO WORKSPACE" title="My Requests" subtitle="Every request is connected to the original donation and its delivery journey."/><FilterBar {...props} placeholder="Search requests, food or donor..." showFoodType/>{requests.length === 0 ? <EmptyState icon="clipboard" title="No requests yet" text="When you request available food, the request will appear here with its current delivery status." action={<button className="fb-primary-btn" onClick={() => props.go('available')}>Browse Available Food <Icon name="arrow" size={17}/></button>}/> : <div className="fb-stack">{requests.map((request) => <RequestCard key={request._id} request={request} onTrack={() => props.go('tracking')}/>)}</div>}</>
}

function RequestCard({ request, onTrack }) {
  return <article className="fb-data-card"><div className="fb-card-top"><div className="fb-food-avatar purple"><Icon name="clipboard"/></div><div className="fb-card-title"><div className="fb-eyebrow">FOOD REQUEST</div><h3>{request.foodName}</h3><p>{request.quantity} <span>•</span> {request.foodType}</p></div><StatusBadge status={request.status}/></div><div className="fb-info-grid"><Info label="Donor" value={request.donorName} icon="user"/><Info label="Pickup" value={request.pickupLocation} icon="location"/><Info label="Volunteer" value={request.volunteerName || 'Waiting for assignment'} icon="truck"/><Info label="Requested" value={formatDate(request.requestedAt)} icon="calendar"/></div><StatusTimeline record={request} compact/><div className="fb-card-footer"><span>Request ID: {String(request._id).slice(-8)}</span><button className="fb-outline-btn" onClick={onTrack}>Open tracking <Icon name="arrow" size={14}/></button></div></article>
}

function TrackingPage({ user, donations, requests, go, role }) {
  const records = role === 'donor' ? donations : requests
  return <><PageHeader eyebrow="LIVE TRACKING" title={role === 'donor' ? 'Donation Tracking' : 'Request Tracking'} subtitle="Follow each milestone from the original request through final delivery." action={<button className="fb-secondary-btn" onClick={() => go(role === 'donor' ? 'my-donations' : 'requests')}><Icon name="back" size={16}/> Back to {role === 'donor' ? 'donations' : 'requests'}</button>}/>{records.length === 0 ? <EmptyState icon="truck" title="Nothing to track yet" text={role === 'donor' ? 'Create a donation first, then its delivery journey will appear here.' : 'Request available food first, then track the delivery here.'} action={<button className="fb-primary-btn" onClick={() => go(role === 'donor' ? 'donations' : 'available')}>{role === 'donor' ? 'Add Donation' : 'Browse Available Food'} <Icon name="arrow" size={17}/></button>}/> : <div className="fb-tracking-list">{records.map((record) => <article className="fb-tracking-card" key={record._id}><div className="fb-tracking-header"><div><div className="fb-eyebrow">DELIVERY #{String(record._id).slice(-8).toUpperCase()}</div><h2>{record.foodName}</h2><p>{record.quantity} <span>•</span> {record.foodType}</p></div><StatusBadge status={record.status}/></div><StatusTimeline record={record}/><div className="fb-tracking-details"><Info label="Donor" value={record.donorName} icon="user"/><Info label="NGO" value={record.requestedByNgo || record.ngoName || 'Waiting for request'} icon="heart"/><Info label="Volunteer" value={record.volunteerName || 'Not assigned yet'} icon="truck"/><Info label="Pickup" value={record.pickupLocation} icon="location"/></div></article>)}</div>}</>
}

function VolunteerTasksPage({ tasks, ...props }) {
  return <><PageHeader eyebrow="VOLUNTEER WORKSPACE" title="Assigned Tasks" subtitle="Your pickup and delivery jobs are shown here with the next action clearly highlighted."/><FilterBar {...props} placeholder="Search food, NGO or pickup location..." showFoodType/>{tasks.length === 0 ? <EmptyState icon="clipboard" title="No assigned tasks" text="New assignments from the admin will appear here."/> : <div className="fb-stack">{tasks.map((task) => <VolunteerTaskCard key={task._id} task={task} {...props}/>)}</div>}</>
}

function VolunteerTaskCard({ task, updateStatus, updatingId }) {
  const next = nextStatus(task.status)
  return <article className="fb-data-card volunteer-task"><div className="fb-card-top"><div className="fb-food-avatar blue"><Icon name="truck"/></div><div className="fb-card-title"><div className="fb-eyebrow">ASSIGNED DELIVERY</div><h3>{task.foodName}</h3><p>{task.quantity} <span>•</span> {task.foodType}</p></div><StatusBadge status={task.status}/></div><div className="fb-route"><RoutePoint label="PICKUP" value={task.pickupLocation} icon="location"/><div className="fb-route-line"><span>→</span></div><RoutePoint label="DELIVER TO" value={task.ngoName || 'NGO'} icon="heart"/></div><StatusTimeline record={task} compact/><div className="fb-next-action"><div><span className="fb-eyebrow">NEXT ACTION</span><strong>{next ? nextActionText(next) : 'Delivery completed'}</strong><p>{next ? nextActionDescription(next) : 'This delivery has reached the NGO successfully.'}</p></div>{next ? <button disabled={updatingId === task._id} className={`fb-action-btn ${STATUS_META[next].tone}`} onClick={() => updateStatus(task, next)}>{updatingId === task._id ? 'Updating...' : nextActionText(next)} <Icon name="arrow" size={17}/></button> : <span className="fb-complete-pill"><Icon name="check" size={15}/> Complete</span>}</div></article>
}

function PickupPage({ tasks, ...props }) {
  const active = tasks.filter((task) => task.status !== 'Delivered')
  return <><PageHeader eyebrow="VOLUNTEER WORKSPACE" title="Pickup Details" subtitle="Everything you need to collect the food from the donor before transport."/>{active.length === 0 ? <EmptyState icon="location" title="No pickup pending" text="When a request is assigned to you, the donor pickup details will appear here."/> : <div className="fb-card-grid">{active.map((task) => <article className="fb-data-card" key={task._id}><div className="fb-card-top"><div className="fb-food-avatar warm"><Icon name="location"/></div><div className="fb-card-title"><div className="fb-eyebrow">PICKUP DETAILS</div><h3>{task.foodName}</h3><p>{task.quantity} <span>•</span> {task.foodType}</p></div><StatusBadge status={task.status}/></div><div className="fb-pickup-highlight"><span className="fb-mini-icon"><Icon name="location" size={18}/></span><div><span>COLLECT FROM</span><strong>{task.pickupLocation}</strong><small>Donor: {task.donorName}</small></div></div><div className="fb-info-grid"><Info label="Available until" value={formatDate(task.availableUntil)} icon="clock"/><Info label="NGO" value={task.ngoName} icon="heart"/><Info label="Request" value={String(task._id).slice(-8)} icon="clipboard"/></div>{task.status === 'Volunteer Assigned' && <button disabled={props.updatingId === task._id} className="fb-primary-btn full-btn" onClick={() => props.updateStatus(task, 'Picked Up')}>{props.updatingId === task._id ? 'Updating...' : 'Mark as Picked Up'} <Icon name="arrow" size={17}/></button>}</article>)}</div>}</>
}

function DeliveryPage({ tasks, ...props }) {
  const active = tasks.filter((task) => task.status !== 'Delivered')
  const completed = tasks.filter((task) => task.status === 'Delivered')
  return <><PageHeader eyebrow="VOLUNTEER WORKSPACE" title="Delivery Status" subtitle="Move each delivery forward one stage at a time and keep the donor and NGO informed."/>{active.length === 0 && completed.length === 0 ? <EmptyState icon="truck" title="No deliveries yet" text="Assigned deliveries will appear here once the admin assigns a volunteer."/> : <div className="fb-stack">{active.map((task) => <VolunteerTaskCard key={task._id} task={task} {...props}/>)}{completed.length > 0 && <section><div className="fb-section-caption">COMPLETED DELIVERIES</div><div className="fb-card-grid">{completed.map((task) => <VolunteerTaskCard key={task._id} task={task} {...props}/>)}</div></section>}</div>}</>
}

function AdminAssignmentsPage({ pendingRequests, volunteers, assign, assigningId, ...props }) {
  return <><PageHeader eyebrow="ADMIN WORKSPACE" title="Assign Volunteers" subtitle="Match pending NGO requests with available volunteers and start the delivery journey." action={<button className="fb-secondary-btn" onClick={() => window.location.reload()}><Icon name="refresh" size={16}/> Refresh</button>}/><div className="fb-admin-summary"><MiniMetric label="Pending" value={pendingRequests.length} tone="orange"/><MiniMetric label="Volunteers" value={volunteers.length} tone="purple"/><MiniMetric label="Ready to assign" value={pendingRequests.length > 0 && volunteers.length > 0 ? 'Yes' : 'No'} tone="green"/></div>{pendingRequests.length === 0 ? <EmptyState icon="check" title="All requests are assigned" text="There are no NGO requests waiting for volunteer assignment."/> : <div className="fb-stack">{pendingRequests.map((request) => <article className="fb-data-card assignment-card" key={request._id}><div className="fb-card-top"><div className="fb-food-avatar purple"><Icon name="clipboard"/></div><div className="fb-card-title"><div className="fb-eyebrow">PENDING REQUEST</div><h3>{request.foodName}</h3><p>{request.quantity} <span>•</span> Requested by {request.ngoName}</p></div><StatusBadge status={request.status}/></div><div className="fb-info-grid"><Info label="Donor" value={request.donorName} icon="user"/><Info label="NGO" value={request.ngoName} icon="heart"/><Info label="Pickup" value={request.pickupLocation} icon="location"/><Info label="Requested" value={formatDate(request.requestedAt)} icon="calendar"/></div><div className="fb-assign-row"><div className="fb-field"><label>Select volunteer</label><select disabled={assigningId === request._id} defaultValue="" onChange={(e) => assign(request, e.target.value)}><option value="">Choose a volunteer...</option>{volunteers.map((v) => <option key={v._id} value={v.email}>{v.name} — {v.email}</option>)}</select></div><div className="fb-assign-note"><Icon name="info" size={16}/><span>Choosing a volunteer immediately assigns this request and creates the next delivery stage.</span></div></div></article>)}</div>}</>
}

function AdminTrackingPage({ allRequests, volunteers, ...props }) {
  return <><PageHeader eyebrow="ADMIN WORKSPACE" title="Delivery Monitoring" subtitle="See every FoodBridge request, its current stage and the people connected to it."/><div className="fb-stat-grid compact-admin">{props.stats.map((stat) => <StatCard key={stat.label} {...stat}/>)}</div><FilterBar {...props} placeholder="Search food, donor, NGO or volunteer..." showFoodType={false} showVolunteer/>{allRequests.length === 0 ? <EmptyState icon="chart" title="No deliveries to monitor" text="Once an NGO requests food, the delivery will appear here."/> : <div className="fb-stack">{allRequests.map((record) => <article className="fb-monitor-card" key={record._id}><div className="fb-monitor-head"><div><div className="fb-eyebrow">REQUEST #{String(record._id).slice(-8).toUpperCase()}</div><h3>{record.foodName}</h3><p>{record.quantity} <span>•</span> {record.foodType}</p></div><StatusBadge status={record.status}/></div><StatusTimeline record={record}/><div className="fb-monitor-people"><PersonChip label="DONOR" value={record.donorName}/><PersonChip label="NGO" value={record.ngoName}/><PersonChip label="VOLUNTEER" value={record.volunteerName || 'Not assigned'}/><PersonChip label="PICKUP" value={record.pickupLocation}/></div></article>)}</div>}</>
}

function ProfilePage({ user, profileName, setProfileName, profileEdit, setProfileEdit, updateProfile, loading }) {
  return <><PageHeader eyebrow="ACCOUNT" title="Profile" subtitle="Manage the account information used across your FoodBridge workspace."/><section className="fb-profile-card"><div className="fb-profile-hero"><div className="fb-avatar large">{user.name.charAt(0).toUpperCase()}</div><div><div className="fb-eyebrow">{ROLE_META[user.role].label.toUpperCase()}</div><h2>{user.name}</h2><p>{user.email}</p></div><button className="fb-secondary-btn profile-edit-btn" onClick={() => { setProfileName(user.name); setProfileEdit((x) => !x) }}><Icon name="edit" size={16}/>{profileEdit ? 'Cancel' : 'Edit Profile'}</button></div>{profileEdit ? <form className="fb-profile-form" onSubmit={updateProfile}><div className="fb-field"><label>Full name</label><input value={profileName} onChange={(e) => setProfileName(e.target.value)}/></div><div className="fb-field"><label>Email</label><input value={user.email} disabled/></div><div className="fb-form-actions"><button className="fb-primary-btn" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'} <Icon name="check" size={16}/></button></div></form> : <div className="fb-profile-details"><Info label="Full name" value={user.name} icon="user"/><Info label="Email address" value={user.email} icon="info"/><Info label="Role" value={ROLE_META[user.role].label} icon={ROLE_META[user.role].icon}/><Info label="Account status" value="Active" icon="check"/></div>}</section></>
}

function ProfileMenu({ user, onProfile, onSettings, onLogout }) {
  return <div className="fb-profile-dropdown">
    <div className="fb-profile-dropdown-head">
      <div className="fb-avatar">{user.name.charAt(0).toUpperCase()}</div>
      <div><strong>{user.name}</strong><span>{user.email}</span></div>
    </div>
    <div className="fb-profile-dropdown-role"><Icon name={ROLE_META[user.role].icon} size={15}/><span>{ROLE_META[user.role].label}</span><span className="fb-menu-status">Active</span></div>
    <div className="fb-profile-dropdown-divider"/>
    <button onClick={onProfile}><Icon name="user" size={17}/><span>Profile</span><Icon name="arrow" size={14}/></button>
    <button onClick={onSettings}><Icon name="chart" size={17}/><span>Settings & appearance</span><Icon name="arrow" size={14}/></button>
    <div className="fb-profile-dropdown-divider"/>
    <button className="danger" onClick={onLogout}><Icon name="logout" size={17}/><span>Sign out</span></button>
  </div>
}

function SettingsPage({ theme, setTheme, compactMode, setCompactMode, notifications, readNotifications, setReadNotifications }) {
  const themes = [
    { id: 'light', label: 'Light', description: 'Clean and bright workspace' },
    { id: 'dark', label: 'Dark', description: 'Low-light friendly workspace' },
    { id: 'system', label: 'System', description: 'Follow your device preference' }
  ]
  const unreadCount = notifications.filter((item) => !readNotifications.includes(item.id)).length
  return <div className="fb-settings-page">
    <PageHeader eyebrow="PREFERENCES" title="Settings" subtitle="Personalize your FoodBridge workspace without changing the data or delivery workflow."/>
    <div className="fb-settings-grid">
      <section className="fb-settings-card">
        <div className="fb-settings-card-head"><div className="fb-settings-icon"><Icon name="spark" size={19}/></div><div><h2>Appearance</h2><p>Choose how FoodBridge looks on this device.</p></div></div>
        <div className="fb-theme-options">{themes.map((item) => <button key={item.id} className={`fb-theme-option ${theme === item.id ? 'selected' : ''}`} onClick={() => setTheme(item.id)}><span className={`fb-theme-preview ${item.id}`}><i/><i/><i/></span><span><strong>{item.label}</strong><small>{item.description}</small></span><span className="fb-radio">{theme === item.id ? '✓' : ''}</span></button>)}</div>
      </section>
      <section className="fb-settings-card">
        <div className="fb-settings-card-head"><div className="fb-settings-icon"><Icon name="grid" size={19}/></div><div><h2>Interface</h2><p>Fine-tune dashboard spacing.</p></div></div>
        <button className="fb-setting-toggle" onClick={() => setCompactMode((x) => !x)}><span><strong>Compact mode</strong><small>Use tighter spacing for larger data lists.</small></span><span className={`fb-switch ${compactMode ? 'on' : ''}`}><i/></span></button>
      </section>
      <section className="fb-settings-card">
        <div className="fb-settings-card-head"><div className="fb-settings-icon"><Icon name="bell" size={19}/></div><div><h2>Notifications</h2><p>Manage your activity notification centre.</p></div></div>
        <div className="fb-setting-row"><div><strong>Unread notifications</strong><small>{unreadCount} currently unread</small></div><button className="fb-outline-btn" disabled={!unreadCount} onClick={() => setReadNotifications(notifications.map((item) => item.id))}>{unreadCount ? 'Mark all read' : 'All read'}</button></div>
      </section>
      <section className="fb-settings-card fb-settings-info">
        <div className="fb-settings-card-head"><div className="fb-settings-icon"><Icon name="shield" size={19}/></div><div><h2>About this workspace</h2><p>FoodBridge connects donors, NGOs, volunteers and admins through the same delivery records.</p></div></div>
        <div className="fb-settings-facts"><span><strong>Theme</strong>{theme === 'system' ? 'System' : theme[0].toUpperCase() + theme.slice(1)}</span><span><strong>Interface</strong>{compactMode ? 'Compact' : 'Comfortable'}</span><span><strong>Activity</strong>Database driven</span></div>
      </section>
    </div>
  </div>
}

function StatusTimeline({ record, compact = false }) {
  const current = STATUS_STEPS.findIndex((step) => step.key === record.status)
  const reached = (index) => index <= current || (record.statusHistory || []).some((x) => x.status === STATUS_STEPS[index].key)
  return <div className={`fb-timeline ${compact ? 'compact' : ''}`}><div className="fb-timeline-line"/><div className="fb-timeline-steps">{STATUS_STEPS.map((step, index) => <div className={`fb-timeline-step ${reached(index) ? 'reached' : ''} ${index === current ? 'current' : ''}`} key={step.key}><div className="fb-timeline-dot">{reached(index) && index !== current ? <Icon name="check" size={13}/> : index === current ? <span/> : ''}</div><span>{step.label}</span></div>)}</div>{!compact && <div className="fb-timeline-bottom"><span>{record.status === 'Delivered' ? 'Delivery completed successfully' : `Current stage: ${STATUS_META[record.status]?.label || record.status}`}</span>{record.statusUpdatedAt && <span>Updated {timeAgo(record.statusUpdatedAt)}</span>}</div>}</div>
}

function StatusBadge({ status }) { const meta = STATUS_META[status] || STATUS_META.Requested; return <span className={`fb-status ${meta.tone}`}><span>{meta.icon}</span>{meta.label}</span> }
function StatCard({ label, value, icon, tone }) { return <div className="fb-stat-card"><div className={`fb-stat-icon ${tone}`}><Icon name={icon} size={21}/></div><div><span>{label}</span><strong>{value}</strong></div></div> }
function MiniMetric({ label, value, tone }) { return <div className={`fb-mini-metric ${tone}`}><span>{label}</span><strong>{value}</strong></div> }
function Info({ label, value, icon }) { return <div className="fb-info"><span className="fb-info-icon"><Icon name={icon} size={15}/></span><div><small>{label}</small><strong title={value}>{value || '—'}</strong></div></div> }
function RoutePoint({ label, value, icon }) { return <div className="fb-route-point"><span className="fb-route-icon"><Icon name={icon} size={17}/></span><div><small>{label}</small><strong>{value}</strong></div></div> }
function PersonChip({ label, value }) { return <div className="fb-person-chip"><small>{label}</small><strong>{value}</strong></div> }
function ActivityRow({ item }) { return <div className="fb-activity-row"><div className={`fb-activity-icon ${STATUS_META[item.status]?.tone || 'green'}`}><Icon name={item.status === 'Delivered' ? 'check' : item.status === 'On the Way' ? 'truck' : item.status === 'Picked Up' ? 'box' : item.status === 'Volunteer Assigned' ? 'user' : 'clipboard'} size={16}/></div><div className="fb-activity-copy"><strong>{item.title}</strong><span>{item.detail}</span></div><time>{timeAgo(item.time)}</time></div> }
function PanelHeading({ eyebrow, title, action }) { return <div className="fb-panel-heading"><div><div className="fb-eyebrow">{eyebrow}</div><h2>{title}</h2></div>{action}</div> }
function PageHeader({ eyebrow, title, subtitle, action }) { return <div className="fb-page-header"><div><div className="fb-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action && <div>{action}</div>}</div> }
function Alert({ type, text, onClose }) { return <div className={`fb-alert ${type}`}><Icon name={type === 'success' ? 'check' : 'info'} size={18}/><span>{text}</span><button onClick={onClose}><Icon name="close" size={16}/></button></div> }
function EmptyState({ icon = 'info', title, text, action, compact = false }) { return <div className={`fb-empty ${compact ? 'compact' : ''}`}><div className="fb-empty-icon"><Icon name={icon} size={28}/></div><h3>{title}</h3><p>{text}</p>{action}</div> }
function LoadingPage() { return <div className="fb-loading-page"><div className="fb-spinner"/><strong>Loading FoodBridge...</strong><span>Getting the latest data from MongoDB</span></div> }
function NavItem({ active, item, onClick, badge = 0 }) { return <button className={`fb-nav-item ${active ? 'active' : ''}`} onClick={onClick}><span className="fb-nav-icon"><Icon name={item.icon} size={18}/></span><span>{item.label}</span>{badge > 0 && <b className="fb-nav-badge">{badge > 9 ? '9+' : badge}</b>}</button> }
function FilterBar({ search, setSearch, statusFilter, setStatusFilter, foodFilter, setFoodFilter, volunteerFilter, setVolunteerFilter, sort, setSort, foodTypes, volunteers = [], resetFilters, placeholder, showStatus = true, showFoodType = false, showVolunteer = false }) { const active = search || statusFilter !== 'All' || foodFilter !== 'All' || volunteerFilter !== 'All' || sort !== 'Newest'; return <div className="fb-filter-bar"><div className="fb-search"><Icon name="search" size={18}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={placeholder}/></div>{showStatus && <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="All">All statuses</option>{STATUS_STEPS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}{showStatus && <option value="Available">Available</option>}</select>}{showFoodType && <select value={foodFilter} onChange={(e) => setFoodFilter(e.target.value)}><option value="All">All food types</option>{foodTypes.map((x) => <option key={x} value={x}>{x}</option>)}</select>}{showVolunteer && <select value={volunteerFilter} onChange={(e) => setVolunteerFilter(e.target.value)}><option value="All">All volunteers</option>{volunteers.map((x) => <option key={x._id} value={x.email}>{x.name}</option>)}</select>}<select value={sort} onChange={(e) => setSort(e.target.value)}><option value="Newest">Newest</option><option value="Oldest">Oldest</option><option value="Status">Status</option></select>{active && <button className="fb-clear-btn" onClick={resetFilters}>Clear</button>}</div> }
function NotificationPanel({ notifications, unread, onMarkRead, onMarkAll }) { return <div className="fb-notification-panel"><div className="fb-notification-head"><div><strong>Notifications</strong><span>{unread.length ? `${unread.length} unread` : 'All caught up'}</span></div><button onClick={onMarkAll}>Mark all read</button></div>{notifications.length === 0 ? <div className="fb-notification-empty"><Icon name="bell" size={25}/><strong>No notifications yet</strong><span>Updates will appear as your FoodBridge activity changes.</span></div> : <div className="fb-notification-list">{notifications.slice(0, 10).map((item) => <button className={`fb-notification-item ${unread.some((x) => x.id === item.id) ? 'unread' : ''}`} key={item.id} onClick={() => onMarkRead(item.id)}><span className={`fb-notification-icon ${STATUS_META[item.status]?.tone || 'green'}`}><Icon name={item.status === 'Delivered' ? 'check' : item.status === 'On the Way' ? 'truck' : item.status === 'Picked Up' ? 'box' : item.status === 'Volunteer Assigned' ? 'user' : 'clipboard'} size={16}/></span><span><strong>{item.title}</strong><small>{item.detail}</small><em>{timeAgo(item.time)}</em></span>{unread.some((x) => x.id === item.id) && <i/>}</button>)}</div>}</div> }

function Auth({ mode, data, setData, error, message, loading, showPassword, setShowPassword, onSubmit, onBack, onSwitch }) { const isLogin = mode === 'login'; return <div className="fb-auth"><div className="fb-auth-brand"><button className="fb-brand" onClick={onBack}><span className="brand-mark"><Icon name="leaf" size={17}/></span>Food<span>Bridge</span></button><p>Smart food redistribution, connected from donation to delivery.</p></div><div className="fb-auth-card"><div className="fb-auth-kicker">{isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}</div><h1>{isLogin ? 'Sign in to FoodBridge' : 'Join FoodBridge'}</h1><p className="fb-auth-subtitle">{isLogin ? 'Continue managing your food redistribution workspace.' : 'Choose your role and start using the connected platform.'}</p>{error && <div className="fb-form-message error"><Icon name="info" size={17}/>{error}</div>}{message && <div className="fb-form-message success"><Icon name="check" size={17}/>{message}</div>}<form onSubmit={onSubmit}>{!isLogin && <div className="fb-field"><label>Full name</label><input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Enter your name" autoComplete="name"/></div>}<div className="fb-field"><label>Email</label><input type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} placeholder="you@example.com" autoComplete="email"/></div><div className="fb-field"><label>Password</label><div className="fb-password"><input type={showPassword ? 'text' : 'password'} value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} placeholder="Minimum 6 characters" autoComplete={isLogin ? 'current-password' : 'new-password'}/><button type="button" onClick={() => setShowPassword((x) => !x)}><Icon name={showPassword ? 'eyeOff' : 'eye'} size={17}/>{showPassword ? 'Hide' : 'Show'}</button></div></div>{!isLogin && <div className="fb-field"><label>Role</label><select value={data.role} onChange={(e) => setData({ ...data, role: e.target.value })}><option value="">Select your role</option><option value="donor">Food Donor</option><option value="ngo">NGO</option><option value="volunteer">Volunteer</option><option value="admin">Admin</option></select></div>}<button disabled={loading} className="fb-primary-btn auth-submit">{loading ? (isLogin ? 'Signing in...' : 'Creating account...') : (isLogin ? 'Sign In' : 'Create Account')} <Icon name="arrow" size={17}/></button></form><div className="fb-auth-switch">{isLogin ? 'New to FoodBridge?' : 'Already have an account?'} <button onClick={onSwitch}>{isLogin ? 'Create account' : 'Sign in'}</button></div><button className="fb-back-link" onClick={onBack}><Icon name="back" size={15}/> Back to home</button></div></div> }

function Home({ onLogin, onRegister, onAbout }) { return <div className="fb-home"><header className="fb-home-nav"><button className="fb-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="brand-mark"><Icon name="leaf" size={17}/></span>Food<span>Bridge</span></button><div className="fb-home-links"><button onClick={onAbout}>How it works</button><button className="fb-home-login" onClick={onLogin}>Sign in</button><button className="fb-home-cta" onClick={onRegister}>Get started <Icon name="arrow" size={15}/></button></div></header><section className="fb-hero"><div className="fb-hero-copy"><span className="fb-hero-badge"><Icon name="spark" size={14}/> SMART FOOD REDISTRIBUTION PLATFORM</span><h1>Turn surplus food into <em>meaningful meals.</em></h1><p>FoodBridge connects donors, NGOs and volunteers so surplus food can move from pickup to delivery with a clear, trackable workflow.</p><div className="fb-hero-actions"><button className="fb-primary-btn" onClick={onRegister}>Start redistributing <Icon name="arrow" size={17}/></button><button className="fb-secondary-btn" onClick={onAbout}>See how it works</button></div><div className="fb-hero-trust"><span><Icon name="check" size={14}/> Role-based workspace</span><span><Icon name="check" size={14}/> Database connected</span><span><Icon name="check" size={14}/> Delivery tracking</span></div></div><div className="fb-hero-visual"><div className="fb-journey-card"><div className="fb-journey-top"><span>LIVE DELIVERY</span><StatusBadge status="On the Way"/></div><h3>Vegetable Rice</h3><p>20 portions <span>•</span> Hope Foundation</p><StatusTimeline record={{ status: 'On the Way', statusHistory: STATUS_STEPS.slice(0, 4).map((x) => ({ status: x.key })) }}/><div className="fb-journey-meta"><span><Icon name="location" size={14}/> Gudiyatham</span><span><Icon name="truck" size={14}/> Volunteer assigned</span></div></div><div className="fb-floating-card one"><span className="fb-floating-icon"><Icon name="box" size={17}/></span><div><strong>Food donated</strong><small>20 portions ready</small></div></div><div className="fb-floating-card two"><span className="fb-floating-icon green"><Icon name="check" size={17}/></span><div><strong>Delivered safely</strong><small>Journey completed</small></div></div></div></section><section className="fb-home-workflow"><div className="fb-centered-heading"><span className="fb-eyebrow">ONE CONNECTED WORKFLOW</span><h2>From donation to delivery</h2><p>Each role has a focused workspace while the same delivery record keeps everyone synchronized.</p></div><div className="fb-workflow-grid"><WorkflowCard number="01" icon="box" title="Donate" text="Donors submit surplus food with quantity, type and pickup details."/><div className="fb-workflow-arrow"><Icon name="arrow"/></div><WorkflowCard number="02" icon="heart" title="Connect" text="NGOs request available food and admins assign a volunteer."/><div className="fb-workflow-arrow"><Icon name="arrow"/></div><WorkflowCard number="03" icon="truck" title="Deliver" text="Volunteers update pickup, transit and delivery stages."/></div></section><section className="fb-home-roles"><div className="fb-centered-heading"><span className="fb-eyebrow">BUILT AROUND FOUR ROLES</span><h2>A clear place for everyone</h2></div><div className="fb-role-grid">{Object.entries(ROLE_META).map(([key, value]) => <div className="fb-role-card" key={key}><div className="fb-role-card-icon"><Icon name={value.icon}/></div><span>{value.short}</span><h3>{value.label}</h3><p>{value.description}</p></div>)}</div></section><footer className="fb-home-footer"><div className="fb-brand"><span className="brand-mark"><Icon name="leaf" size={16}/></span>Food<span>Bridge</span></div><span>Smart food redistribution platform</span></footer></div> }

function WorkflowCard({ number, icon, title, text }) { return <div className="fb-workflow-card"><span>{number}</span><div className="fb-workflow-icon"><Icon name={icon}/></div><h3>{title}</h3><p>{text}</p></div> }
function About({ onBack, onRegister }) { return <div className="fb-about"><header className="fb-home-nav"><button className="fb-brand" onClick={onBack}><span className="brand-mark"><Icon name="leaf" size={17}/></span>Food<span>Bridge</span></button><button className="fb-secondary-btn" onClick={onBack}><Icon name="back" size={15}/> Back</button></header><main className="fb-about-main"><span className="fb-hero-badge"><Icon name="spark" size={14}/> HOW FOODBRIDGE WORKS</span><h1>One record. Four roles. One clear journey.</h1><p>FoodBridge is designed to coordinate surplus food redistribution through role-based dashboards and a shared delivery status.</p><div className="fb-about-flow">{STATUS_STEPS.map((step, index) => <div className="fb-about-step" key={step.key}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step.label}</strong>{index < STATUS_STEPS.length - 1 && <Icon name="arrow" size={17}/>}</div>)}</div><div className="fb-about-grid"><div><h2>Why it works</h2><p>Donors create food records, NGOs request them, admins coordinate volunteers, and volunteers move the delivery through each stage. The donor and NGO can then see the same progress.</p></div><div><h2>Built for clarity</h2><p>Each dashboard focuses on the actions that role needs: donating, requesting, assigning, picking up, transporting and completing the delivery.</p></div></div><button className="fb-primary-btn" onClick={onRegister}>Create a FoodBridge account <Icon name="arrow" size={17}/></button></main></div> }

function quickActions(role) { if (role === 'donor') return [{ id: 'donations', icon: 'plus', label: 'Add Donation', text: 'Share surplus food', tone: 'green' }, { id: 'my-donations', icon: 'box', label: 'My Donations', text: 'View submitted food', tone: 'blue' }, { id: 'tracking', icon: 'truck', label: 'Track Donation', text: 'Follow every stage', tone: 'orange' }]; if (role === 'ngo') return [{ id: 'available', icon: 'box', label: 'Available Food', text: 'Browse current donations', tone: 'teal' }, { id: 'requests', icon: 'clipboard', label: 'My Requests', text: 'Manage food requests', tone: 'purple' }, { id: 'tracking', icon: 'truck', label: 'Request Tracking', text: 'Follow delivery progress', tone: 'orange' }]; if (role === 'volunteer') return [{ id: 'tasks', icon: 'clipboard', label: 'Assigned Tasks', text: 'View your delivery jobs', tone: 'purple' }, { id: 'pickup', icon: 'location', label: 'Pickup Details', text: 'See donor pickup information', tone: 'orange' }, { id: 'delivery', icon: 'truck', label: 'Delivery Status', text: 'Update the next stage', tone: 'blue' }]; return [{ id: 'assignments', icon: 'users', label: 'Assign Volunteers', text: 'Handle pending requests', tone: 'purple' }, { id: 'admin-tracking', icon: 'chart', label: 'Monitor Deliveries', text: 'Watch the full network', tone: 'teal' }] }
function primarySection(role) { return role === 'donor' ? 'donations' : role === 'ngo' ? 'available' : role === 'volunteer' ? 'tasks' : 'assignments' }
function primaryLabel(role) { return role === 'donor' ? 'Add a Donation' : role === 'ngo' ? 'Browse Available Food' : role === 'volunteer' ? 'View Assigned Tasks' : 'Assign Volunteers' }
function nextStatus(status) { const index = STATUS_STEPS.findIndex((x) => x.key === status); return index >= 0 && index < STATUS_STEPS.length - 1 ? STATUS_STEPS[index + 1].key : null }
function nextActionText(status) { return status === 'Picked Up' ? 'Mark as Picked Up' : status === 'On the Way' ? 'Mark as On the Way' : 'Mark as Delivered' }
function nextActionDescription(status) { return status === 'Picked Up' ? 'Confirm that you collected the food from the donor.' : status === 'On the Way' ? 'Confirm the food has left the pickup location.' : 'Confirm that the NGO has received the food.' }
function getTimeGreeting() { const hour = new Date().getHours(); return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening' }
function roleLabel(role) { return ROLE_META[role]?.label || role }
function formatDate(value) { if (!value) return '—'; const date = new Date(value); if (Number.isNaN(date.getTime())) return String(value); return date.toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function timeAgo(value) { if (!value) return 'Just now'; const diff = Math.max(0, Date.now() - new Date(value).getTime()); const mins = Math.floor(diff / 60000); if (mins < 1) return 'Just now'; if (mins < 60) return `${mins}m ago`; const hours = Math.floor(mins / 60); if (hours < 24) return `${hours}h ago`; const days = Math.floor(hours / 24); return `${days}d ago` }

export default App
