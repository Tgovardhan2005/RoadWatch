import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Fix for default Leaflet icon ---
// This is the correct way to reference icon images in a local Create React App environment.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// --- Main App Component ---
export default function App() {
    const [reports, setReports] = useState([]);
    const [view, setView] = useState('map');
    const [loading, setLoading] = useState(true);
    const [appError, setAppError] = useState(null);

    // --- Data Fetching from Backend ---
    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/api/reports');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setReports(data);
        } catch (error) {
            console.error("Failed to fetch reports:", error);
            setAppError("Could not connect to the backend server. Is it running?");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);


    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold">Loading RoadWatch...</div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col h-screen">
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 inline-block mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 4a1 1 0 012 0v5.586l1.293-1.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 9.586V4z" clipRule="evenodd" />
                        </svg>
                        RoadWatch
                    </h1>
                </div>
            </header>

            <main className="container mx-auto p-4 flex-grow flex flex-col">
                {appError && (
                     <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md my-4" role="alert">
                        <p className="font-bold">An Error Occurred</p>
                        <p>{appError}</p>
                    </div>
                )}
                
                <nav className="bg-gray-100 border-y rounded-lg p-2 mb-4 flex justify-center space-x-2 md:space-x-4">
                    <button onClick={() => setView('map')} className={`px-3 py-2 text-sm md:text-base rounded-md font-semibold ${view === 'map' ? 'bg-blue-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Map View</button>
                    <button onClick={() => setView('list')} className={`px-3 py-2 text-sm md:text-base rounded-md font-semibold ${view === 'list' ? 'bg-blue-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Reports List</button>
                    <button onClick={() => setView('report')} className={`px-3 py-2 text-sm md:text-base rounded-md font-semibold ${view === 'report' ? 'bg-blue-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Report Damage</button>
                </nav>

                <div className="flex-grow">
                    {view === 'map' && <MapView reports={reports} />}
                    {view === 'list' && <ReportsList reports={reports} />}
                    {view === 'report' && <ReportForm setView={setView} onReportSubmitted={fetchReports} />}
                </div>
            </main>
        </div>
    );
}

// --- Map View Component ---
function MapView({ reports }) {
    const defaultCenter = [20.5937, 78.9629]; 
    const mapCenter = reports.length > 0 && reports[0].location ? [reports[0].location.latitude, reports[0].location.longitude] : defaultCenter;

    return (
        <div className="h-full w-full rounded-lg shadow-lg overflow-hidden">
            <MapContainer center={mapCenter} zoom={reports.length > 0 ? 13 : 5} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                {reports.map(report => (
                    report.location &&
                    <React.Fragment key={report._id}>
                        <Circle center={[report.location.latitude, report.location.longitude]} pathOptions={{ color: 'red', fillColor: '#f03', fillOpacity: 0.5 }} radius={200} />
                        <Marker position={[report.location.latitude, report.location.longitude]}>
                            <Popup>
                                <div className="w-64">
                                    {report.imageUrl && <img src={report.imageUrl} alt="Damaged Road" className="w-full h-32 object-cover rounded-md mb-2"/>}
                                    <h3 className="font-bold text-lg">{report.description}</h3>
                                    <p className="text-sm text-gray-600">Status: <span className={`font-semibold ${report.status === 'Reported' ? 'text-yellow-500' : 'text-green-500'}`}>{report.status}</span></p>
                                    <p className="text-xs text-gray-400">Reported on: {new Date(report.timestamp).toLocaleString()}</p>
                                </div>
                            </Popup>
                        </Marker>
                    </React.Fragment>
                ))}
            </MapContainer>
        </div>
    );
}

// --- Reports List Component ---
function ReportsList({ reports }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">All Reported Issues</h2>
            <div className="space-y-4">
                {reports.length === 0 && <p>No reports yet. Be the first to report an issue!</p>}
                {reports.map(report => (
                    <div key={report._id} className="p-4 border rounded-lg flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
                        {report.imageUrl && <img src={report.imageUrl} alt="Damage" className="w-full md:w-40 h-32 object-cover rounded-md"/>}
                        <div className="flex-grow">
                            <p className="font-bold text-gray-800">{report.description}</p>
                            {report.location && <p className="text-sm text-gray-500">Location: {report.location.latitude.toFixed(5)}, {report.location.longitude.toFixed(5)}</p>}
                            <p className="text-sm text-gray-500">Reported by: {report.userName || 'Anonymous'}</p>
                            <p className="text-xs text-gray-400">Time: {new Date(report.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                             <span className={`px-3 py-1 text-sm font-semibold rounded-full ${report.status === 'Reported' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{report.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Report Form Component ---
function ReportForm({ setView, onReportSubmitted }) {
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [location, setLocation] = useState(null);
    const [userName, setUserName] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
                    setError('');
                },
                () => {
                    setError('Unable to retrieve your location. Using default for testing.');
                    setLocation({ latitude: 28.6139, longitude: 77.2090 }); 
                }
            );
        } else {
            setError('Geolocation is not supported by your browser. Using default for testing.');
            setLocation({ latitude: 28.6139, longitude: 77.2090 }); 
        }
    };
    
    useEffect(() => {
        getLocation();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!description || !location) {
            setError('Please provide a description and location.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        let imageBase64 = null;
        if (imageFile) {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
            imageBase64 = reader.result;
        }

        try {
            const reportData = {
                description,
                imageUrl: imageBase64,
                location,
                userName: userName || 'Anonymous',
            };

            const response = await fetch('http://localhost:5001/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reportData),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to submit report.');
            }
            
            onReportSubmitted();
            setView('list');

        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Report Road Damage</h2>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">Your Name (Optional)</label>
                    <input id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="e.g., John Doe" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Large pothole near the main intersection." className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" rows="4" required></textarea>
                </div>
                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Upload Image (Optional)</label>
                    <input type="file" id="image" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    {imageFile && <p className="text-sm text-gray-600 mt-2">Selected: {imageFile.name}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-md">
                        <button type="button" onClick={getLocation} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg text-sm">Get Current Location</button>
                        {location ? <p className="text-sm text-green-600">Location captured: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p> : <p className="text-sm text-gray-500">Please provide your location.</p>}
                    </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-blue-300 transition duration-300 flex items-center justify-center">
                    {isSubmitting ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Submitting...</>) : ('Submit Report')}
                </button>
            </form>
        </div>
    );
}
