const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Add this (was missing) so Types.ObjectId validation works
const { Types } = mongoose;

const app = express();
const port = 5001;

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' })); // accept large Base64 strings

// --- MongoDB Connection ---
const mongoURI = "mongodb+srv://govardhant23cse:hVVc6EgRkRUBJoZ3@roadwatchcluster.cgajzfu.mongodb.net/roadwatch?retryWrites=true&w=majority&appName=RoadWatchCluster";

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Schemas ---
const reportSchema = new mongoose.Schema({
  description: String,
  imageUrl: String,
  location: {
    latitude: Number,
    longitude: Number,
  },
  status: { type: String, default: 'Reported' },
  userName: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
});
const Report = mongoose.model('Report', reportSchema);

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, default: 'user' }, // 'user' | 'admin'
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const JWT_SECRET = process.env.JWT_SECRET || 'DEV_CHANGE_ME';

// --- Auth middleware ---
function auth(requiredRole) {
  return (req, res, next) => {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'No token' });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, adminCode } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email & password required' });
    if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const role = (adminCode && adminCode === (process.env.ADMIN_CODE || 'ADMIN123')) ? 'admin' : 'user';
    const user = await User.create({ name, email, passwordHash, role });
    const token = jwt.sign({ id: user._id, email, role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name, email, role } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// --- Report Routes ---
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ timestamp: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/reports/:id', async (req, res) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid report id format' });
  }
  try {
    const rpt = await Report.findById(id);
    if (!rpt) return res.status(404).json({ message: 'Report not found' });
    res.json(rpt);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/reports', auth(), async (req, res) => {
  const { description, imageUrl, location, userName } = req.body;
  if (!description || !location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    return res.status(400).json({ message: 'Description and valid location required' });
  }
  const userId = req.user.id;
  const finalUserName = userName || req.user.email || 'Anonymous';
  try {
    const newReport = await Report.create({
      description,
      imageUrl,
      location,
      userName: finalUserName,
      userId,
      status: 'Reported',
    });
    res.status(201).json(newReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.patch('/api/reports/:id/status', auth('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status required' });
    const updated = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.delete('/api/reports/:id', auth(), async (req, res) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid report id format', id });
  }
  try {
    console.log('[DELETE] id:', id, 'user:', req.user?.id, 'role:', req.user?.role);
    const report = await Report.findById(id);
    if (!report) {
      console.log('[DELETE] Report not found in DB');
      return res.status(404).json({ message: 'Report not found', id });
    }
    const isOwner = report.userId && report.userId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      console.log('[DELETE] Forbidden (owner/admin mismatch)');
      return res.status(403).json({ message: 'Not authorized to delete this report', id });
    }
    await report.deleteOne();
    console.log('[DELETE] Success');
    return res.json({ message: 'Deleted', id });
  } catch (e) {
    console.error('[DELETE] Error', e);
    return res.status(500).json({ message: e.message || 'Server error deleting report', id });
  }
});

// Debug route to list all registered routes
app.get('/_routes', (req, res) => {
  const routes = [];
  (app._router?.stack || []).forEach(m => {
    if (m.route) routes.push({ path: m.route.path, methods: Object.keys(m.route.methods) });
  });
  res.json(routes);
});

// --- Start the server ---
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  (app._router?.stack || [])
    .filter(l => l.route)
    .forEach(l => console.log('[ROUTE]', Object.keys(l.route.methods).join(',').toUpperCase(), l.route.path));
});
