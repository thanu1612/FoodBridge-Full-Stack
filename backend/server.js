const express = require('express')
const { MongoClient, ObjectId } = require('mongodb')
const crypto = require('crypto')

const app = express()
const PORT = 5000
const MONGO_URL = 'mongodb://127.0.0.1:27017'
const DB_NAME = 'foodbridge'
const client = new MongoClient(MONGO_URL)

app.use(express.json())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

let db

function cleanEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function validObjectId(value) {
  return ObjectId.isValid(value)
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword) return false
  if (!storedPassword.startsWith('scrypt$')) return password === storedPassword
  const parts = storedPassword.split('$')
  if (parts.length !== 3) return false
  const [, salt, storedHash] = parts
  const derived = crypto.scryptSync(password, salt, 64).toString('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(storedHash, 'hex'))
  } catch {
    return false
  }
}

function nextStatusIsValid(currentStatus, nextStatus) {
  const order = {
    Requested: 0,
    'Volunteer Assigned': 1,
    'Picked Up': 2,
    'On the Way': 3,
    Delivered: 4
  }
  if (!(nextStatus in order)) return false
  const current = currentStatus === 'Available' ? -1 : (order[currentStatus] ?? 0)
  return order[nextStatus] >= current && order[nextStatus] <= current + 1
}

app.get('/', (req, res) => {
  res.json({ message: 'FoodBridge backend is running' })
})

// ---------------- Register ----------------
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    const allowedRoles = ['donor', 'ngo', 'volunteer', 'admin']

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please fill all registration fields.' })
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ message: 'Please enter a valid email address.' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must contain at least 6 characters.' })
    }
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid user role.' })
    }

    const normalizedEmail = cleanEmail(email)
    const existingUser = await db.collection('users').findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    await db.collection('users').insertOne({
      name: name.trim(),
      email: normalizedEmail,
      password: hashPassword(password),
      role,
      createdAt: new Date()
    })

    res.status(201).json({ message: 'Registration successful. You can now log in.' })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Unable to register user.' })
  }
})

// ---------------- Login ----------------
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const normalizedEmail = cleanEmail(email)
    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const user = await db.collection('users').findOne({ email: normalizedEmail })
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    // Upgrade older plain-text local test accounts after a successful login.
    if (!String(user.password).startsWith('scrypt$')) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { password: hashPassword(password) } }
      )
    }

    res.json({
      message: 'Login successful.',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Unable to log in.' })
  }
})

// ---------------- Create Donation ----------------
app.post('/api/donations', async (req, res) => {
  try {
    const { foodName, quantity, foodType, pickupLocation, availableUntil, description, donorName, donorEmail } = req.body
    if (!foodName || !quantity || !foodType || !pickupLocation || !availableUntil || !donorName || !donorEmail) {
      return res.status(400).json({ message: 'Please fill all required donation details.' })
    }

    const createdAt = new Date()
    const donation = {
      foodName: foodName.trim(),
      quantity: String(quantity).trim(),
      foodType: foodType.trim(),
      pickupLocation: pickupLocation.trim(),
      availableUntil,
      description: String(description || '').trim(),
      donorName: donorName.trim(),
      donorEmail: cleanEmail(donorEmail),
      status: 'Available',
      statusHistory: [{ status: 'Available', updatedAt: createdAt }],
      requestId: null,
      requestedByNgo: '',
      requestedByNgoEmail: '',
      volunteerName: '',
      volunteerEmail: '',
      assignedAt: null,
      createdAt
    }

    const result = await db.collection('donations').insertOne(donation)
    res.status(201).json({ message: 'Food donation submitted successfully.', donationId: result.insertedId })
  } catch (error) {
    console.error('Create donation error:', error)
    res.status(500).json({ message: 'Unable to create food donation.' })
  }
})

// ---------------- Donor Donations ----------------
app.get('/api/donations', async (req, res) => {
  try {
    const donorEmail = cleanEmail(req.query.donorEmail)
    if (!donorEmail) return res.status(400).json({ message: 'Donor email is required.' })
    const donations = await db.collection('donations').find({ donorEmail }).sort({ createdAt: -1 }).toArray()
    res.json(donations)
  } catch (error) {
    console.error('Fetch donations error:', error)
    res.status(500).json({ message: 'Unable to fetch donations.' })
  }
})

// ---------------- Available Donations ----------------
app.get('/api/donations/available', async (req, res) => {
  try {
    const donations = await db.collection('donations').find({ status: 'Available' }).sort({ createdAt: -1 }).toArray()
    res.json(donations)
  } catch (error) {
    console.error('Fetch available donations error:', error)
    res.status(500).json({ message: 'Unable to fetch available food.' })
  }
})

// ---------------- Create NGO Request ----------------
app.post('/api/requests', async (req, res) => {
  try {
    const { donationId, ngoName, ngoEmail } = req.body
    if (!donationId || !ngoName || !ngoEmail) return res.status(400).json({ message: 'Donation and NGO details are required.' })
    if (!validObjectId(donationId)) return res.status(400).json({ message: 'Invalid donation ID.' })

    const donation = await db.collection('donations').findOne({ _id: new ObjectId(donationId), status: 'Available' })
    if (!donation) return res.status(404).json({ message: 'This food donation is no longer available.' })

    const ngoEmailClean = cleanEmail(ngoEmail)
    const duplicate = await db.collection('requests').findOne({ donationId: new ObjectId(donationId), ngoEmail: ngoEmailClean })
    if (duplicate) return res.status(409).json({ message: 'You have already requested this food donation.' })

    const requestedAt = new Date()
    const request = {
      donationId: new ObjectId(donationId),
      foodName: donation.foodName,
      quantity: donation.quantity,
      foodType: donation.foodType,
      pickupLocation: donation.pickupLocation,
      availableUntil: donation.availableUntil,
      description: donation.description,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      ngoName: ngoName.trim(),
      ngoEmail: ngoEmailClean,
      status: 'Requested',
      requestedAt,
      statusHistory: [{ status: 'Requested', updatedAt: requestedAt }],
      volunteerName: '',
      volunteerEmail: '',
      assignedAt: null,
      statusUpdatedAt: requestedAt
    }

    const result = await db.collection('requests').insertOne(request)
    await db.collection('donations').updateOne(
      { _id: new ObjectId(donationId), status: 'Available' },
      {
        $set: {
          status: 'Requested',
          requestId: result.insertedId,
          requestedByNgo: ngoName.trim(),
          requestedByNgoEmail: ngoEmailClean,
          requestedAt
        },
        $push: { statusHistory: { status: 'Requested', updatedAt: requestedAt } }
      }
    )

    res.status(201).json({ message: 'Food request submitted successfully.', requestId: result.insertedId })
  } catch (error) {
    console.error('Create request error:', error)
    res.status(500).json({ message: 'Unable to create food request.' })
  }
})

// ---------------- NGO Requests ----------------
app.get('/api/requests', async (req, res) => {
  try {
    const ngoEmail = cleanEmail(req.query.ngoEmail)
    if (!ngoEmail) return res.status(400).json({ message: 'NGO email is required.' })
    const requests = await db.collection('requests').find({ ngoEmail }).sort({ requestedAt: -1 }).toArray()
    res.json(requests)
  } catch (error) {
    console.error('Fetch NGO requests error:', error)
    res.status(500).json({ message: 'Unable to fetch requests.' })
  }
})

// ---------------- Volunteers ----------------
app.get('/api/volunteers', async (req, res) => {
  try {
    const volunteers = await db.collection('users').find(
      { role: 'volunteer' },
      { projection: { name: 1, email: 1, role: 1 } }
    ).sort({ name: 1 }).toArray()
    res.json(volunteers)
  } catch (error) {
    console.error('Fetch volunteers error:', error)
    res.status(500).json({ message: 'Unable to fetch volunteers.' })
  }
})

// ---------------- Pending Requests ----------------
app.get('/api/requests/pending', async (req, res) => {
  try {
    const requests = await db.collection('requests').find({ status: 'Requested' }).sort({ requestedAt: 1 }).toArray()
    res.json(requests)
  } catch (error) {
    console.error('Fetch pending requests error:', error)
    res.status(500).json({ message: 'Unable to fetch pending requests.' })
  }
})

// ---------------- All Requests ----------------
app.get('/api/requests/all', async (req, res) => {
  try {
    const requests = await db.collection('requests').find({}).sort({ requestedAt: -1 }).toArray()
    res.json(requests)
  } catch (error) {
    console.error('Fetch all requests error:', error)
    res.status(500).json({ message: 'Unable to fetch all requests.' })
  }
})

// ---------------- Admin Summary ----------------
app.get('/api/admin/summary', async (req, res) => {
  try {
    const [users, donations, requests, volunteers, delivered, active, pending] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('donations').countDocuments(),
      db.collection('requests').countDocuments(),
      db.collection('users').countDocuments({ role: 'volunteer' }),
      db.collection('requests').countDocuments({ status: 'Delivered' }),
      db.collection('requests').countDocuments({ status: { $in: ['Volunteer Assigned', 'Picked Up', 'On the Way'] } }),
      db.collection('requests').countDocuments({ status: 'Requested' })
    ])
    res.json({ users, donations, requests, volunteers, delivered, active, pending })
  } catch (error) {
    console.error('Admin summary error:', error)
    res.status(500).json({ message: 'Unable to fetch admin summary.' })
  }
})

// ---------------- Legacy Admin Routes ----------------
app.get('/api/admin/requests', async (req, res) => {
  try {
    const requests = await db.collection('requests').find({}).sort({ requestedAt: -1 }).toArray()
    res.json(requests)
  } catch (error) {
    console.error('Admin requests error:', error)
    res.status(500).json({ message: 'Unable to fetch admin requests.' })
  }
})

// ---------------- Assign Volunteer ----------------
app.post('/api/requests/assign', async (req, res) => {
  try {
    const { requestId, volunteerName, volunteerEmail } = req.body
    if (!requestId || !volunteerName || !volunteerEmail) return res.status(400).json({ message: 'Request and volunteer details are required.' })
    if (!validObjectId(requestId)) return res.status(400).json({ message: 'Invalid request ID.' })

    const volunteer = await db.collection('users').findOne({ email: cleanEmail(volunteerEmail), role: 'volunteer' })
    if (!volunteer) return res.status(404).json({ message: 'Selected volunteer was not found.' })

    const request = await db.collection('requests').findOne({ _id: new ObjectId(requestId) })
    if (!request) return res.status(404).json({ message: 'Food request not found.' })
    if (request.status !== 'Requested') return res.status(400).json({ message: 'This request has already been assigned or processed.' })

    const assignedAt = new Date()
    const historyEntry = { status: 'Volunteer Assigned', updatedAt: assignedAt }

    await db.collection('requests').updateOne(
      { _id: new ObjectId(requestId), status: 'Requested' },
      {
        $set: { status: 'Volunteer Assigned', volunteerName: volunteer.name, volunteerEmail: volunteer.email, assignedAt, statusUpdatedAt: assignedAt },
        $push: { statusHistory: historyEntry }
      }
    )

    if (request.donationId) {
      await db.collection('donations').updateOne(
        { _id: request.donationId },
        {
          $set: { status: 'Volunteer Assigned', volunteerName: volunteer.name, volunteerEmail: volunteer.email, assignedAt, statusUpdatedAt: assignedAt },
          $push: { statusHistory: historyEntry }
        }
      )
    }

    res.json({ message: 'Volunteer assigned successfully.' })
  } catch (error) {
    console.error('Assign volunteer error:', error)
    res.status(500).json({ message: 'Unable to assign volunteer.' })
  }
})

// ---------------- Volunteer Tasks ----------------
app.get('/api/tasks', async (req, res) => {
  try {
    const volunteerEmail = cleanEmail(req.query.volunteerEmail)
    if (!volunteerEmail) return res.status(400).json({ message: 'Volunteer email is required.' })
    const tasks = await db.collection('requests').find({ volunteerEmail }).sort({ assignedAt: -1 }).toArray()
    res.json(tasks)
  } catch (error) {
    console.error('Fetch volunteer tasks error:', error)
    res.status(500).json({ message: 'Unable to fetch volunteer tasks.' })
  }
})

// ---------------- Update Delivery Status ----------------
app.post('/api/tasks/status', async (req, res) => {
  try {
    const { requestId, volunteerEmail, status } = req.body
    const allowedStatuses = ['Volunteer Assigned', 'Picked Up', 'On the Way', 'Delivered']
    if (!requestId || !volunteerEmail || !status) return res.status(400).json({ message: 'Request, volunteer email and status are required.' })
    if (!validObjectId(requestId)) return res.status(400).json({ message: 'Invalid request ID.' })
    if (!allowedStatuses.includes(status)) return res.status(400).json({ message: 'Invalid delivery status.' })

    const request = await db.collection('requests').findOne({ _id: new ObjectId(requestId), volunteerEmail: cleanEmail(volunteerEmail) })
    if (!request) return res.status(404).json({ message: 'Assigned task not found.' })
    if (!nextStatusIsValid(request.status, status)) return res.status(400).json({ message: 'Delivery status must move forward one stage at a time.' })

    const statusTime = new Date()
    const historyEntry = { status, updatedAt: statusTime }

    await db.collection('requests').updateOne(
      { _id: new ObjectId(requestId), volunteerEmail: cleanEmail(volunteerEmail) },
      { $set: { status, statusUpdatedAt: statusTime }, $push: { statusHistory: historyEntry } }
    )

    if (request.donationId) {
      await db.collection('donations').updateOne(
        { _id: request.donationId },
        { $set: { status, statusUpdatedAt: statusTime }, $push: { statusHistory: historyEntry } }
      )
    }

    res.json({ message: `Delivery status updated to "${status}".` })
  } catch (error) {
    console.error('Update task status error:', error)
    res.status(500).json({ message: 'Unable to update delivery status.' })
  }
})

// ---------------- Update Profile ----------------
app.put('/api/profile', async (req, res) => {
  try {
    const { email, name } = req.body
    const normalizedEmail = cleanEmail(email)
    if (!normalizedEmail || !name || !name.trim()) return res.status(400).json({ message: 'Name and email are required.' })

    const user = await db.collection('users').findOne({ email: normalizedEmail })
    if (!user) return res.status(404).json({ message: 'User account not found.' })

    await db.collection('users').updateOne({ _id: user._id }, { $set: { name: name.trim() } })

    // Keep displayed names synchronized with existing project records for future activity.
    const role = user.role
    await db.collection('donations').updateMany({ donorEmail: normalizedEmail }, { $set: { donorName: name.trim() } })
    if (role === 'ngo') await db.collection('requests').updateMany({ ngoEmail: normalizedEmail }, { $set: { ngoName: name.trim() } })
    if (role === 'volunteer') {
      await db.collection('requests').updateMany({ volunteerEmail: normalizedEmail }, { $set: { volunteerName: name.trim() } })
      await db.collection('donations').updateMany({ volunteerEmail: normalizedEmail }, { $set: { volunteerName: name.trim() } })
    }

    res.json({ message: 'Profile updated successfully.', user: { _id: user._id, name: name.trim(), email: user.email, role: user.role } })
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({ message: 'Unable to update profile.' })
  }
})

async function startServer() {
  try {
    await client.connect()
    db = client.db(DB_NAME)
    console.log('MongoDB connected successfully')
    console.log(`Database: ${DB_NAME}`)
    app.listen(PORT, () => console.log(`FoodBridge backend running on http://localhost:${PORT}`))
  } catch (error) {
    console.error('Unable to start FoodBridge backend:', error)
    process.exit(1)
  }
}

startServer()
