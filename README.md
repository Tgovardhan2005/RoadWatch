# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

---

## Image Storage Flow (Base64 in MongoDB)

This app stores uploaded / captured images as Base64 data URL strings directly in the MongoDB Report documents (field: `imageUrl`). Below is the end‑to‑end lifecycle.

### 1. Image Acquisition (Browser)
Two paths inside `src/App.js` (ReportForm):
- File upload: user selects a file (`<input type="file" />`)
- Live camera: video stream → canvas snapshot

Conversion to Base64:
```javascript
// File upload path (simplified)
// ...existing code...
const reader = new FileReader();
reader.readAsDataURL(imageFile);
reader.onload = () => {
  imageBase64 = reader.result; // "data:image/jpeg;base64,/9j/4AAQ..."
};
// ...existing code...

// Camera capture path (simplified)
// ...existing code...
canvas.toDataURL('image/jpeg', 0.9); // returns same style data URL
// ...existing code...
```
Result format: data:[MIME];base64,[BASE64_PAYLOAD]

Example prefix:
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...
```

### 2. Preparing the Report Payload
Still in ReportForm (`handleSubmit`):
```javascript
const reportData = {
  description,
  imageUrl: imageBase64, // may be null if no image
  location,
  userName
};
fetch('http://localhost:5001/api/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reportData)
});
```

### 3. Backend Reception
In `backend/server.js`:
```javascript
app.use(express.json({ limit: '10mb' })); // allows large Base64 strings
// ...existing code...
app.post('/api/reports', auth(), async (req, res) => {
  const { imageUrl } = req.body; // already a data URL string
  await Report.create({ /* ... */, imageUrl });
});
```
No transformation occurs server-side; the string is persisted as-is.

### 4. MongoDB Storage
`reportSchema`:
```javascript
imageUrl: String, // stores full data URL (NOT just the raw base64 segment)
```
Document sample (trimmed):
```json
{
  "_id": "...",
  "description": "Pothole near junction",
  "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "location": { "latitude": 12.9716, "longitude": 77.5946 },
  "status": "Reported",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### 5. Retrieval & Rendering
Frontend fetches `/api/reports`, then:
```jsx
{report.imageUrl && <img src={report.imageUrl} alt="Damage" />}
```
The browser decodes the data URL automatically—no extra code required.

### 6. Why a Data URL?
Pros:
- Simplifies prototype (no file server / CDN / S3).
- Bundled with the JSON document.

Cons:
- 30–35% size overhead vs binary.
- Larger MongoDB document size (BSON 16MB limit).
- Repeated string if reused in multiple contexts (no caching benefits).

### 7. Potential Improvements
| Goal | Option |
| ---- | ------- |
| Reduce payload size | Compress client-side (canvas scale/quality) |
| Better caching | Upload to object storage (S3 / Cloud Storage) and store URL |
| Large images | Use GridFS or external storage |
| Security | Strip EXIF before storing (canvas already removes metadata) |

### 8. Quick Validation Checklist
- Express body limit high enough? (Yes: 10mb)
- Base64 length acceptable? (Typical mobile JPEG < 1MB → OK)
- Field nullable? (Yes: `imageUrl` omitted or null works)
- Rendering safe? (Yes: `img src` with trusted server-originated string)

### 9. Minimal End-to-End Pseudocode
```mermaid
flowchart LR
A[User selects file / captures camera] --> B[Convert to data URL (FileReader or canvas.toDataURL)]
B --> C[Embed in JSON: imageUrl:"data:image/jpeg;base64,..."]
C --> D[POST /api/reports]
D --> E[Express parses JSON]
E --> F[Mongoose Report.create({ imageUrl })]
F --> G[Stored in MongoDB]
G --> H[GET /api/reports]
H --> I[<img src={imageUrl}/> renders]
```

### 10. Detecting Base64 Data URLs
A stored string is a data URL if it matches:
```
^data:(image\/(png|jpe?g|webp));base64,[A-Za-z0-9+/=]+$
```

---

## Summary
The image is never binary on the server—it stays a Base64 data URL string from browser generation through MongoDB persistence to frontend rendering. This keeps implementation simple but can be optimized later by externalizing file storage.

---

## Live Location Capture Flow (Geolocation in Report Form)

The Report form (ReportForm in `src/App.js`) auto-captures and displays the user's current coordinates using the browser Geolocation API.

### 1. State Initialization
```javascript
// In ReportForm component
const [location, setLocation] = useState(null);
```

### 2. Geolocation Retrieval Function
```javascript
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setError('');
      },
      () => {
        // Failure handler: permission denied / timeout / unsupported
        setError('Unable to retrieve your location. Using default for testing.');
        setLocation({ latitude: 28.6139, longitude: 77.2090 }); // fallback (Delhi)
      }
    );
  } else {
    setError('Geolocation is not supported by your browser. Using default for testing.');
    setLocation({ latitude: 28.6139, longitude: 77.2090 });
  }
}
```

### 3. Automatic Initial Fetch
```javascript
useEffect(() => {
  getLocation();       // Runs once on mount to pre-fill coordinates
}, []);
```

### 4. Manual Refresh (Button)
In the Location section of the form a button re-invokes `getLocation()`:
```jsx
<button type="button" onClick={getLocation}>Get Current Location</button>
```

### 5. Conditional Display in the Form
```jsx
{location
  ? <p>Location captured: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
  : <p>Please provide your location.</p>}
```
`toFixed(4)` shortens the decimals for cleaner UI.

### 6. Inclusion in Submission Payload
When submitting:
```javascript
const reportData = {
  description,
  imageUrl: imageBase64,
  location,          // { latitude, longitude }
  userName: userName || 'Anonymous'
};
```
The location object is sent as-is in the JSON body to `POST /api/reports`.

### 7. Backend Persistence
`backend/server.js` stores it inside the report document:
```javascript
location: {
  latitude: Number,
  longitude: Number
}
```

### 8. Display Elsewhere
- Map: markers & circles use `report.location.latitude / longitude`
- List: shows coordinates with `toFixed(5)`
- Popups: same location object

### 9. Fallback Behavior
If geolocation fails or is blocked:
- Error message set via `setError(...)`
- Default coordinates `{ latitude: 28.6139, longitude: 77.2090 }` used so testing can continue.

### 10. Privacy Considerations (Future)
Potential enhancements:
- Prompt user consent with clearer messaging
- Allow manual coordinate editing or map picker
- Obfuscate (round) precision for public display if needed

### Minimal Extract (Trimmed From ReportForm)
```javascript
// ...existing code...
const [location, setLocation] = useState(null);
const [error, setError] = useState('');
const getLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => { setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); setError(''); },
      () => { setError('Unable to retrieve your location. Using default for testing.');
              setLocation({ latitude: 28.6139, longitude: 77.2090 }); }
    );
  } else {
    setError('Geolocation is not supported by your browser. Using default for testing.');
    setLocation({ latitude: 28.6139, longitude: 77.2090 });
  }
};
useEffect(() => { getLocation(); }, []);
// In JSX:
<button type="button" onClick={getLocation}>Get Current Location</button>
{location
  ? <p>Location captured: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
  : <p>Please provide your location.</p>}
// ...existing code...
```

---

## Project Stakeholders (RoadWatch)

| Stakeholder | Role / Interest |
| ----------- | ---------------- |
| Citizens / Commuters | Submit real-world road hazard reports to improve daily travel safety. |
| Municipal / Public Works Dept | Prioritize, plan, and track road maintenance actions. |
| Admin Users (Platform Moderators) | Manage reports, update statuses, enforce proper usage. |
| Maintenance Crews / Contractors | Receive actionable, geo-tagged tasks for field repairs. |
| City Planners / Infrastructure Engineers | Analyze spatial & temporal trends for long-term investment. |
| Traffic & Transportation Authorities | Mitigate congestion or reroute around major hazards. |
| Emergency Services (Indirect) | Identify and avoid obstruction-prone routes when responding. |
| Local Government Leadership | Monitor service responsiveness and allocate budgets transparently. |
| Community / Resident Associations | Advocate for timely fixes and track accountability. |
| Data / Smart City Analysts | Integrate report data into broader urban intelligence dashboards. |
| Logistics / Delivery & Fleet Operators | Optimize routing, reduce vehicle damage risk. |
| Insurance / Risk Assessors (Potential) | Use condition data to inform localized risk profiling. |
| Development / DevOps Team | Maintain platform reliability, security, and scalability. |

### Stakeholder Data Touchpoints
- Reports API: Citizens → Backend → Admin dashboard / Map.
- Status Changes: Admin → Users (UI refresh) for transparency.
- Geo Data: Enables clustering, heat mapping, future analytics.
- Auth & Roles: Ensures separation between public reporters and administrative workflow.

### Future Enhancements for Stakeholders
- Push / email notifications on status changes (citizens).
- Exportable CSV / GeoJSON for planners.
- Role: crew-assignment workflow with progress timestamps.
- Public transparency dashboard (aggregated metrics).
- Webhooks for integration with municipal ticketing systems.
