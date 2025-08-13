const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 5001;

// --- Middleware ---
// Increase the payload size limit to accept larger Base64 image strings
app.use(cors());
app.use(express.json({ limit: '10mb' })); 

// --- MongoDB Connection ---
const mongoURI = "mongodb+srv://govardhant23cse:hVVc6EgRkRUBJoZ3@roadwatchcluster.cgajzfu.mongodb.net/?retryWrites=true&w=majority&appName=RoadWatchCluster";

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schema ---
const reportSchema = new mongoose.Schema({
  description: String,
  imageUrl: String, // This will now store the Base64 string
  location: {
    latitude: Number,
    longitude: Number,
  },
  status: { type: String, default: 'Reported' },
  userName: String,
  timestamp: { type: Date, default: Date.now },
});

const Report = mongoose.model('Report', reportSchema);

// --- API Routes ---

// GET all reports
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ timestamp: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new report
app.post('/api/reports', async (req, res) => {
  const { description, imageUrl, location, userName } = req.body;

  const report = new Report({
    description: description,
    imageUrl: imageUrl, // The Base64 string from the frontend
    location: location,
    userName: userName,
    status: 'Reported',
  });

  try {
    const newReport = await report.save();
    res.status(201).json(newReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- Start the server ---
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
