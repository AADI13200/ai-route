import React, { useState, useEffect } from 'react';
import './RoutePlanner.css';
import EnhancedMap from './EnhancedMap';
import RouteComparison from './RouteComparison';
import ElevationChart from './ElevationChart';
import LoadingSkeleton from './LoadingSkeleton';
import RouteAnalytics from './RouteAnalytics';
import WeatherForecast from './WeatherForecast';
import CarbonFootprint from './CarbonFootprint';
import FloatingActions from './FloatingActions';

const MODES = [
  {id:'walk',icon:'🚶',label:'Walk'},
  {id:'cycle',icon:'🚴',label:'Cycle'},
  {id:'drive',icon:'🚗',label:'Drive'},
  {id:'transit',icon:'🚌',label:'Transit'},
];

const PROFILES = [
  {id:'healthy',icon:'💪',label:'Healthy Adult',sens:1.0},
  {id:'sensitive',icon:'😷',label:'Mildly Sensitive',sens:1.5},
  {id:'asthma',icon:'🫁',label:'Asthma',sens:2.2},
  {id:'elderly',icon:'👴',label:'Elderly',sens:1.8},
  {id:'child',icon:'👶',label:'Child',sens:2.0},
];

// Major Indian cities with coordinates
const INDIAN_CITIES = {
  'Mumbai': { lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  'Delhi': { lat: 28.7041, lng: 77.1025, state: 'Delhi' },
  'Bangalore': { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  'Hyderabad': { lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  'Chennai': { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  'Kolkata': { lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  'Pune': { lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  'Jaipur': { lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  'Lucknow': { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
  'Chandigarh': { lat: 30.7333, lng: 76.7794, state: 'Chandigarh' },
  'Bhopal': { lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh' },
  'Indore': { lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' },
  'Nagpur': { lat: 21.1458, lng: 79.0882, state: 'Maharashtra' },
  'Visakhapatnam': { lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh' },
  'Thane': { lat: 19.2183, lng: 72.9781, state: 'Maharashtra' },
  'Patna': { lat: 25.5941, lng: 85.1376, state: 'Bihar' },
  'Vadodara': { lat: 22.3072, lng: 73.1812, state: 'Gujarat' },
  'Ghaziabad': { lat: 28.6692, lng: 77.4538, state: 'Uttar Pradesh' },
  'Ludhiana': { lat: 30.9010, lng: 75.8573, state: 'Punjab' },
  'Agra': { lat: 27.1767, lng: 78.0081, state: 'Uttar Pradesh' },
  'Nashik': { lat: 19.9975, lng: 73.7898, state: 'Maharashtra' },
  'Faridabad': { lat: 28.4089, lng: 77.3178, state: 'Haryana' },
  'Meerut': { lat: 28.9845, lng: 77.7064, state: 'Uttar Pradesh' },
  'Rajkot': { lat: 22.3039, lng: 70.8022, state: 'Gujarat' },
  'Varanasi': { lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh' },
  'Surat': { lat: 21.1702, lng: 72.8311, state: 'Gujarat' },
  'Kanpur': { lat: 26.4499, lng: 80.3319, state: 'Uttar Pradesh' },
  'Coimbatore': { lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu' },
  'Mysore': { lat: 12.2958, lng: 76.6394, state: 'Karnataka' },
};

// Popular routes
const POPULAR_ROUTES = [
  { from: 'Mumbai', to: 'Pune' },
  { from: 'Delhi', to: 'Agra' },
  { from: 'Bangalore', to: 'Mysore' },
  { from: 'Hyderabad', to: 'Visakhapatnam' },
  { from: 'Chennai', to: 'Bangalore' },
  { from: 'Ahmedabad', to: 'Vadodara' },
  { from: 'Jaipur', to: 'Delhi' },
  { from: 'Mumbai', to: 'Surat' },
];

function genRoutes(src, dst, mode, profile){
  const sens = PROFILES.find(p=>p.id===profile)?.sens||1;
  const h = (src+dst+mode).split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const mult = {walk:3.8,cycle:2.0,drive:1.0,transit:1.4}[mode]||1;
  const base = 18 + (h%12);
  const dist = 5.5 + (h%7)*0.8;
  const routes = [
    {id:'fastest',name:'Fastest',tagline:'Time-optimized',icon:'⚡',
     time:Math.round(base*mult), dist:(dist*0.88).toFixed(1),
     via:'NH highway corridor',aqi:140+(h%25),
     pm25:40+(h%12), pm10:70+(h%18), no2:58+(h%14), o3:30+(h%8),
     traffic:'Heavy',expRaw:82,rec:false},
    {id:'balanced',name:'Balanced',tagline:'Best overall choice',icon:'⚖️',
     time:Math.round(base*mult*1.28), dist:(dist*1.12).toFixed(1),
     via:'City roads & boulevards',aqi:78+(h%18),
     pm25:22+(h%8), pm10:38+(h%10), no2:30+(h%8), o3:18+(h%6),
     traffic:'Moderate',expRaw:48,rec:true},
    {id:'cleanest',name:'Cleanest',tagline:'Minimum pollution',icon:'🌿',
     time:Math.round(base*mult*1.65), dist:(dist*1.45).toFixed(1),
     via:'Green belt & park roads',aqi:22+(h%14),
     pm25:8+(h%5), pm10:16+(h%7), no2:11+(h%5), o3:9+(h%4),
     traffic:'Light',expRaw:18,rec:false},
  ];
  // Generate sample turn instructions
  const turnInstructions = [
    { instruction: `Head north on ${src} Main Road`, distance: 500, duration: 120, maneuver: 'straight' },
    { instruction: 'Turn right onto NH Highway', distance: 1200, duration: 300, maneuver: 'turn right' },
    { instruction: 'Continue straight for 5 km', distance: 5000, duration: 300, maneuver: 'straight' },
    { instruction: 'Turn left at traffic signal', distance: 800, duration: 180, maneuver: 'turn left' },
    { instruction: `Merge onto ${dst} Ring Road`, distance: 3500, duration: 420, maneuver: 'merge' },
    { instruction: `Arrive at ${dst}`, distance: 200, duration: 60, maneuver: 'arrive' }
  ];

  return routes.map(r=>{
    const expScore = Math.round(r.expRaw*sens);
    const expLabel = expScore<30 ? 'Low Risk' : expScore<60 ? 'Moderate Risk' : expScore<80 ? 'High Risk' : 'Very High Risk';
    return {...r,
      expScore,
      expLabel,
      saved: routes[0].time - r.time,
      turnInstructions: turnInstructions
    };
  });
}

function RoutePlanner(){
  const [src,setSrc] = useState('');
  const [dst,setDst] = useState('');
  const [mode,setMode] = useState('drive');
  const [profile,setProfile] = useState('healthy');
  const [routes,setRoutes] = useState(null);
  const [sel,setSel] = useState(null);
  const [loading,setLoading] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [mapType, setMapType] = useState('roadmap');
  const [recentSearches, setRecentSearches] = useState([]);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [activeInput, setActiveInput] = useState(null); // 'src' or 'dst'
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionInput, setActiveSuggestionInput] = useState(null);
  const [suggestionCoords, setSuggestionCoords] = useState({ src: null, dst: null });
  const [darkMode, setDarkMode] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [showHealthTip, setShowHealthTip] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showCarbon, setShowCarbon] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('purepath_recent');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const getCityCoords = (cityName) => {
    const city = INDIAN_CITIES[cityName];
    if (city) return { lat: city.lat, lng: city.lng };
    // Generate pseudo-random coords based on name hash for unknown cities
    const h = cityName.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    return {
      lat: 20.5937 + (h % 20) * 0.5 - 5, // Spread across India
      lng: 78.9629 + ((h * 2) % 20) * 0.5 - 5
    };
  };

  const saveSearch = (from, to) => {
    const newSearch = { from, to, time: Date.now() };
    const updated = [newSearch, ...recentSearches.filter(s => !(s.from === from && s.to === to))].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('purepath_recent', JSON.stringify(updated));
  };

  const selectCity = (city) => {
    // Prevent selecting same city for both source and destination
    if (activeInput === 'src') {
      if (city === dst) {
        alert('Source and destination cannot be the same city');
        setShowCityPicker(false);
        setActiveInput(null);
        return;
      }
      setSrc(city);
      setSuggestionCoords(prev => ({ ...prev, src: INDIAN_CITIES[city] }));
    } else if (activeInput === 'dst') {
      if (city === src) {
        alert('Source and destination cannot be the same city');
        setShowCityPicker(false);
        setActiveInput(null);
        return;
      }
      setDst(city);
      setSuggestionCoords(prev => ({ ...prev, dst: INDIAN_CITIES[city] }));
    }
    setShowCityPicker(false);
    setActiveInput(null);
  };

  // Fetch location suggestions from Nominatim API
  const fetchLocationSuggestions = async (query, inputType) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Use Nominatim API for geocoding (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&limit=5&countrycodes=in`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'PurePath/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const suggestions = data.map(item => ({
          name: item.display_name.split(',')[0],
          fullAddress: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type,
          importance: item.importance
        }));
        
        setLocationSuggestions(suggestions);
        setShowSuggestions(true);
        setActiveSuggestionInput(inputType);
      }
    } catch (error) {
      console.error('Location search failed:', error);
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Debounce function for search input
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Debounced location search
  const debouncedFetchSuggestions = debounce(fetchLocationSuggestions, 500);

  // Select a suggestion
  const selectSuggestion = (suggestion) => {
    if (activeSuggestionInput === 'src') {
      setSrc(suggestion.name);  // Use short name for cleaner display
      setSuggestionCoords(prev => ({ ...prev, src: { lat: suggestion.lat, lng: suggestion.lng, name: suggestion.name } }));
    } else {
      setDst(suggestion.name);
      setSuggestionCoords(prev => ({ ...prev, dst: { lat: suggestion.lat, lng: suggestion.lng, name: suggestion.name } }));
    }
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  // Geocode address using Nominatim
  const geocodeAddress = async (address) => {
    try {
      // Add India context if not already present
      const searchQuery = address.toLowerCase().includes('india') 
        ? address 
        : `${address}, India`;
        
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=in`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'PurePath/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const result = data[0];
          console.log('Geocoded:', address, '->', result.display_name, { lat: result.lat, lon: result.lon });
          return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            name: result.display_name.split(',')[0]
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Geocoding failed:', error);
      return null;
    }
  };

  const search = async () => {
    if(!src.trim()||!dst.trim()) return;
    setLoading(true); setRoutes(null); setSel(null); setMarkers([]);
    
    saveSearch(src, dst);
    
    // Get coordinates - prefer suggestion coordinates if available
    let srcCoords = suggestionCoords.src;
    let dstCoords = suggestionCoords.dst;
    
    // If no suggestion was selected, try to geocode the typed address
    if (!srcCoords) {
      srcCoords = await geocodeAddress(src);
    }
    if (!dstCoords) {
      dstCoords = await geocodeAddress(dst);
    }
    
    // Check if coordinates are valid
    if (!srcCoords || !dstCoords || 
        !srcCoords.lat || !srcCoords.lng || 
        !dstCoords.lat || !dstCoords.lng) {
      alert('Could not find accurate coordinates. Please select a location from the suggestions dropdown.');
      setLoading(false);
      return;
    }
    
    console.log('Using coordinates:', {
      source: { name: src, lat: srcCoords.lat, lng: srcCoords.lng },
      destination: { name: dst, lat: dstCoords.lat, lng: dstCoords.lng }
    });
    
    setMarkers([
      { lat: srcCoords.lat, lng: srcCoords.lng, type: 'source', label: suggestionCoords.src?.name || src },
      { lat: dstCoords.lat, lng: dstCoords.lng, type: 'destination', label: suggestionCoords.dst?.name || dst }
    ]);
    
    try {
      // Call backend for real Google Maps route
      const response = await fetch('http://localhost:8000/get-hybrid-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: { lat: srcCoords.lat, lng: srcCoords.lng },
          destination: { lat: dstCoords.lat, lng: dstCoords.lng },
          health_profile: profile,
          fitness_mode: false,
          transport_mode: mode === 'transit' ? 'driving' : mode,
          priority: 'balanced'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform backend routes to frontend format
        const transformedRoutes = data.routes.map((route, idx) => ({
          id: route.route_type || ['fastest', 'balanced', 'cleanest'][idx],
          name: route.name || ['Fastest', 'Balanced', 'Cleanest'][idx],
          tagline: route.route_type === 'fastest' ? 'Time-optimized' : 
                   route.route_type === 'cleanest' ? 'Minimum pollution' : 'Best overall',
          icon: route.route_type === 'fastest' ? '⚡' : route.route_type === 'cleanest' ? '🌿' : '⚖️',
          time: Math.round((route.duration_seconds || 1800) / 60),
          dist: ((route.distance_meters || 15000) / 1000).toFixed(1),
          via: route.via || 'Via main route',
          aqi: route.avg_aqi || 100,
          pm25: route.pm25 || 25,
          pm10: route.pm10 || 50,
          no2: route.no2 || 30,
          o3: route.o3 || 20,
          traffic: route.traffic || 'Moderate',
          expRaw: route.exposure_score || 50,
          expScore: route.exposure_score || 50,
          expLabel: route.exposure_label || 'Moderate',
          rec: route.is_recommended || idx === 1,
          path: route.path || [
            { lat: srcCoords.lat, lng: srcCoords.lng },
            { lat: dstCoords.lat, lng: dstCoords.lng }
          ],
          turnInstructions: route.turn_instructions || []
        }));
        
        setRoutes(transformedRoutes);
        setSel(transformedRoutes.find(r => r.rec) || transformedRoutes[0]);
      } else {
        // Fallback to generated routes
        const r = genRoutes(src,dst,mode,profile);
        setRoutes(r);
        setSel(r[1]);
      }
    } catch (error) {
      console.error('Route fetch failed:', error);
      // Fallback to generated routes
      const r = genRoutes(src,dst,mode,profile);
      setRoutes(r);
      setSel(r[1]);
    }
    
    setLoading(false);
  };

  // Toast helper
  const showToast = (message, icon = '✅') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // Share route
  const handleShare = () => {
    if (navigator.share && src && dst) {
      navigator.share({
        title: 'PurePath Route',
        text: `Check out this pollution-aware route from ${src} to ${dst} via PurePath!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard?.writeText(`${src} → ${dst}: ${window.location.href}`);
      showToast('Route link copied to clipboard!', '🔗');
    }
  };

  // Export GPX
  const handleExport = () => {
    if (!sel || !sel.path) return;
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PurePath">
  <trk><name>${src} to ${dst}</name><trkseg>
    ${sel.path.map(p => `<trkpt lat="${p.lat}" lon="${p.lng}"></trkpt>`).join('\n    ')}
  </trkseg></trk>
</gpx>`;
    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-${src}-to-${dst}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('GPX file exported!', '📥');
  };

  // Voice search
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast('Voice search not supported in this browser', '⚠️');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSrc(transcript);
      showToast(`Heard: "${transcript}"`, '🎤');
    };
    recognition.start();
    showToast('Listening... Speak your destination', '🎤');
  };

  // Reset
  const handleReset = () => {
    setSrc('');
    setDst('');
    setRoutes(null);
    setMarkers([]);
    setShowComparison(false);
    setShowAnalytics(false);
    setShowWeather(false);
    setShowCarbon(false);
    showToast('Route planner reset', '🔄');
  };


  return (
    <div className="route-planner">
      {/* Header */}
      <div className="header">
        <div className="logo">
          <div className="logo-icon">🗺️</div>
          <div>
            <div className="logo-text gradient-text">PurePath</div>
            <div className="logo-sub">AI-Powered Pollution-Aware Navigation</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#7589a8',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            {darkMode ? '☀️' : '🌙'} {darkMode ? 'Light' : 'Dark'}
          </button>
          <a
            href="https://github.com/AADI13200"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#7589a8',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
              textDecoration: 'none'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.color = '#a855f7'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = '#7589a8'; }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            GitHub
          </a>
          <div className="live-badge">
            <div className="live-dot"></div>
            Live AQI Data
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="main">
        {/* Form */}
        <div className="form-card">
          <div className="input-row">
            <div style={{ position: 'relative' }}>
              <label className="label">From</label>
              <div className="input-with-picker">
                <input 
                  className="inp" 
                  value={src} 
                  onChange={e => {
                    setSrc(e.target.value);
                    setSuggestionCoords(prev => ({ ...prev, src: null }));  // Clear stored coords when typing
                    debouncedFetchSuggestions(e.target.value, 'src');
                  }}
                  onFocus={() => {
                    if (src.length >= 3) fetchLocationSuggestions(src, 'src');
                  }}
                  placeholder="Type location, e.g. 'Koregaon Park, Pune'..."
                  onKeyDown={e=>e.key==='Enter'&&search()}
                  autoComplete="off"
                />
                <button 
                  className="picker-btn" 
                  onClick={() => { setActiveInput('src'); setShowCityPicker(true); }}
                  title="Select from list"
                >
                  📍
                </button>
                <button 
                  className="picker-btn" 
                  onClick={handleVoiceSearch}
                  title="Voice search"
                  style={{ marginLeft: '4px' }}
                >
                  🎤
                </button>
              </div>
              {/* Coordinate indicator */}
              {suggestionCoords.src && (
                <div style={{ 
                  fontSize: '11px', 
                  color: '#22c55e', 
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>✓</span>
                  <span>📍 {suggestionCoords.src.lat.toFixed(4)}, {suggestionCoords.src.lng.toFixed(4)}</span>
                </div>
              )}
              {/* Suggestions Dropdown */}
              {showSuggestions && activeSuggestionInput === 'src' && locationSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#1a1d29',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  marginTop: '4px',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}>
                  {locationSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectSuggestion(suggestion)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: idx < locationSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(56,189,248,0.1)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#fff', marginBottom: '2px' }}>
                        {suggestion.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#7589a8' }}>
                        {suggestion.fullAddress.substring(suggestion.name.length + 2)}
                      </div>
                      <div style={{ fontSize: '10px', color: '#22c55e', marginTop: '4px' }}>
                        📍 {suggestion.lat.toFixed(4)}, {suggestion.lng.toFixed(4)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <label className="label">To</label>
              <div className="input-with-picker">
                <input 
                  className="inp" 
                  value={dst} 
                  onChange={e => {
                    setDst(e.target.value);
                    setSuggestionCoords(prev => ({ ...prev, dst: null }));  // Clear stored coords when typing
                    debouncedFetchSuggestions(e.target.value, 'dst');
                  }}
                  onFocus={() => {
                    if (dst.length >= 3) fetchLocationSuggestions(dst, 'dst');
                  }}
                  placeholder="Type destination, e.g. 'Hinjewadi, Pune'..."
                  onKeyDown={e=>e.key==='Enter'&&search()}
                  autoComplete="off"
                />
                <button 
                  className="picker-btn" 
                  onClick={() => { setActiveInput('dst'); setShowCityPicker(true); }}
                  title="Select from list"
                >
                  📍
                </button>
              </div>
              {/* Coordinate indicator */}
              {suggestionCoords.dst && (
                <div style={{ 
                  fontSize: '11px', 
                  color: '#22c55e', 
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>✓</span>
                  <span>📍 {suggestionCoords.dst.lat.toFixed(4)}, {suggestionCoords.dst.lng.toFixed(4)}</span>
                </div>
              )}
              {/* Suggestions Dropdown */}
              {showSuggestions && activeSuggestionInput === 'dst' && locationSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#1a1d29',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  marginTop: '4px',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}>
                  {locationSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectSuggestion(suggestion)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: idx < locationSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        ':hover': { background: 'rgba(56,189,248,0.1)' }
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(56,189,248,0.1)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#fff', marginBottom: '2px' }}>
                        {suggestion.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#7589a8' }}>
                        {suggestion.fullAddress.substring(suggestion.name.length + 2)}
                      </div>
                      <div style={{ fontSize: '10px', color: '#22c55e', marginTop: '4px' }}>
                        📍 {suggestion.lat.toFixed(4)}, {suggestion.lng.toFixed(4)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Location Select */}
          <label className="label">Quick Select Popular Routes</label>
          <div className="popular-routes">
            {POPULAR_ROUTES.map((route, idx) => (
              <button 
                key={idx} 
                className="route-chip"
                onClick={() => { setSrc(route.from); setDst(route.to); }}
              >
                {route.from} → {route.to}
              </button>
            ))}
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <>
              <label className="label">Recent Searches</label>
              <div className="recent-searches">
                {recentSearches.map((search, idx) => (
                  <button 
                    key={idx} 
                    className="route-chip recent"
                    onClick={() => { setSrc(search.from); setDst(search.to); }}
                  >
                    🕐 {search.from} → {search.to}
                  </button>
                ))}
              </div>
            </>
          )}

          <label className="label">Travel Mode</label>
          <div className="mode-row">
            {MODES.map(m=> (
              <button 
                key={m.id} 
                className={`mode-btn ${mode===m.id?' active':''}`}
                onClick={()=>setMode(m.id)}
              >
                <span className="mico">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          <label className="label">Health Profile</label>
          <div className="profile-row">
            {PROFILES.map(p=> (
              <button 
                key={p.id} 
                className={`profile-chip ${profile===p.id?' active':''}`}
                onClick={()=>setProfile(p.id)}
              >
                <span>{p.icon}</span> {p.label}
              </button>
            ))}
          </div>

          <button 
            className="search-btn"
            onClick={search}
            disabled={loading||!src.trim()||!dst.trim()}
          >
            {loading ? '🔄  Analyzing pollution & routes...' : '🗺️  Find Healthiest Route'}
          </button>
        </div>

        {/* City Picker Modal */}
        {showCityPicker && (
          <div className="city-picker-overlay" onClick={() => setShowCityPicker(false)}>
            <div className="city-picker" onClick={e => e.stopPropagation()}>
              <div className="city-picker-header">
                <h3>Select a City</h3>
                <button className="close-btn" onClick={() => setShowCityPicker(false)}>×</button>
              </div>
              <div className="city-grid">
                {Object.entries(INDIAN_CITIES).map(([name, data]) => (
                  <button key={name} className="city-btn" onClick={() => selectCity(name)}>
                    <span className="city-name">{name}</span>
                    <span className="city-state">{data.state}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        {markers.length > 0 && (
          <div className="map-section">
            <div className="map-controls">
              <span className="map-label">🗺️ Route Map</span>
              <div className="map-type-toggle">
                <button 
                  className={mapType === 'roadmap' ? 'active' : ''} 
                  onClick={() => setMapType('roadmap')}
                  title="Standard road map"
                >
                  🗺️ Road
                </button>
                <button 
                  className={mapType === 'satellite' ? 'active' : ''} 
                  onClick={() => setMapType('satellite')}
                  title="Satellite imagery"
                >
                  🛰️ Satellite
                </button>
                <button 
                  className={mapType === 'terrain' ? 'active' : ''} 
                  onClick={() => setMapType('terrain')}
                  title="Topographic terrain"
                >
                  ⛰️ Terrain
                </button>
                <button 
                  className={mapType === 'dark' ? 'active' : ''} 
                  onClick={() => setMapType('dark')}
                  title="Dark mode map"
                >
                  🌙 Dark
                </button>
              </div>
            </div>
            <div className="map-card" style={{ height: '450px' }}>
              <EnhancedMap 
                routes={routes || []}
                selectedRoute={sel?.id}
                markers={markers}
                center={[markers[0]?.lat || 20.5937, markers[0]?.lng || 78.9629]}
                zoom={markers.length === 1 ? 14 : 12}
                mapType={darkMode ? (mapType === 'roadmap' ? 'dark' : mapType) : mapType}
                showAQI={true}
                showPOI={true}
                showWeather={true}
                showTraffic={true}
              />
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <>
            <LoadingSkeleton type="map" />
            <LoadingSkeleton type="route" />
          </>
        )}

        {/* Results */}
        {routes && (
          <div>
            {/* Stats row */}
            <div className="stat-row">
              <div className="stat-box">
                <div className="stat-label">Distance</div>
                <div className="stat-val" style={{color:'#3b82f6'}}>{sel?.dist || routes[0]?.dist} km</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Duration</div>
                <div className="stat-val" style={{color:'#22c55e'}}>{sel?.time || routes[0]?.time} min</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Route Type</div>
                <div className="stat-val" style={{color:'#f59e0b'}}>{sel?.name || 'Best'}</div>
              </div>
            </div>

            {/* Route cards - simplified without AQI */}
            <div className="route-grid">
              {routes.map(r=>{
                const isSel = sel?.id===r.id;
                const routeColor = r.id === 'fastest' ? '#3b82f6' : r.id === 'cleanest' ? '#22c55e' : '#f59e0b';
                return (
                  <div 
                    key={r.id}
                    className={`route-card ${isSel?' selected':''}`}
                    style={{'--card-accent': routeColor}}
                    onClick={()=>setSel(r)}
                  >
                    {r.rec && <div className="rec-badge">RECOMMENDED</div>}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div className="route-name">{r.icon} {r.name}</div>
                        <div className="route-sub">{r.tagline}</div>
                        <div style={{marginTop: '6px'}}>
                          <span className={`aqi-badge ${
                            (r.aqi || 100) <= 50 ? 'good' : 
                            (r.aqi || 100) <= 100 ? 'moderate' : 
                            (r.aqi || 100) <= 150 ? 'unhealthy' : 
                            (r.aqi || 100) <= 200 ? 'very-unhealthy' : 'hazardous'
                          }`}>
                            🌫️ AQI {(r.aqi || 100)}
                          </span>
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div className="aqi-big" style={{color: routeColor}}>{r.time}</div>
                        <div className="aqi-lbl">min</div>
                      </div>
                    </div>
                    <div className="route-meta">
                      <div className="route-meta-row">
                        <span> {r.dist} km</span>
                        <span style={{color: routeColor}}>● {r.name}</span>
                      </div>
                      <div className="route-via">via {r.via}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comparison Toggle */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '14px' 
            }}>
              <button
                onClick={() => setShowComparison(!showComparison)}
                style={{
                  background: showComparison ? 'rgba(6,182,212,0.15)' : 'transparent',
                  border: `1px solid ${showComparison ? 'var(--teal)' : 'var(--border)'}`,
                  borderRadius: '20px',
                  padding: '8px 18px',
                  color: showComparison ? 'var(--teal)' : 'var(--muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                📊 {showComparison ? 'Hide Comparison' : 'View Detailed Comparison'}
              </button>
            </div>

            {/* Route Comparison */}
            {showComparison && (
              <RouteComparison 
                routes={routes} 
                selectedRoute={sel?.id}
                onSelect={(route) => setSel(route)}
              />
            )}

            {/* Elevation Profile for selected route */}
            {sel && (
              <div className="form-card" style={{ animation: 'fadeIn 0.4s ease 0.15s both' }}>
                <ElevationChart route={sel} />
              </div>
            )}

            {/* Health Tips */}
            {showHealthTip && sel && (
              <div style={{ animation: 'fadeIn 0.4s ease 0.2s both' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <span style={{ fontSize: '12px', color: '#7589a8', fontWeight: 600 }}>
                    💡 Health Advisory
                  </span>
                  <button 
                    onClick={() => setShowHealthTip(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#7589a8',
                      fontSize: '16px',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="health-tip">
                  {(sel.aqi || 100) <= 50 ? (
                    <span>✅ Air quality is good. Safe for all health profiles including children and elderly.</span>
                  ) : (sel.aqi || 100) <= 100 ? (
                    <span>⚠️ Moderate air quality. Sensitive individuals should consider wearing a mask during outdoor activities.</span>
                  ) : (sel.aqi || 100) <= 150 ? (
                    <span>🟠 Unhealthy for sensitive groups. {profile === 'healthy' ? 'Healthy adults can proceed with caution.' : 'Consider an alternative route or delay travel if possible.'}</span>
                  ) : (
                    <span>🔴 Poor air quality. {profile === 'healthy' ? 'Limit outdoor exposure and wear an N95 mask.' : 'Avoid this route. Seek indoor alternatives immediately.'}</span>
                  )}
                </div>
              </div>
            )}

            {/* Advanced Features Toggle Bar */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '14px',
              overflowX: 'auto',
              paddingBottom: '4px'
            }}>
              {[
                { key: 'analytics', label: '📈 Analytics', active: showAnalytics, setter: setShowAnalytics, color: '#a855f7' },
                { key: 'weather', label: '🌤️ Weather', active: showWeather, setter: setShowWeather, color: '#f59e0b' },
                { key: 'carbon', label: '🌍 Carbon', active: showCarbon, setter: setShowCarbon, color: '#22c55e' },
              ].map(btn => (
                <button
                  key={btn.key}
                  onClick={() => btn.setter(!btn.active)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: `1px solid ${btn.active ? btn.color : 'var(--border)'}`,
                    background: btn.active ? `${btn.color}15` : 'transparent',
                    color: btn.active ? btn.color : '#7589a8',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Route Analytics */}
            {showAnalytics && sel && (
              <RouteAnalytics route={sel} mode={mode} />
            )}

            {/* Weather Forecast */}
            {showWeather && sel && (
              <WeatherForecast route={sel} />
            )}

            {/* Carbon Footprint */}
            {showCarbon && sel && (
              <CarbonFootprint route={sel} mode={mode} />
            )}

            {/* Route Info */}
            <div className="ai-card">
              <div className="ai-header">
                <div className="ai-icon">🛣️</div>
                <div>
                  <div style={{fontSize:15,fontWeight:600}}>Route Summary</div>
                  <div style={{fontSize:11,color:'#7589a8'}}>{src} → {dst}</div>
                </div>
              </div>
              <div className="ai-text">
                <p style={{marginBottom: '10px'}}>
                  <strong>Selected Route:</strong> {sel?.name} via {sel?.via}
                </p>
                <p style={{marginBottom: '10px'}}>
                  <strong>Distance:</strong> {sel?.dist} km | <strong>Time:</strong> {sel?.time} minutes | <strong>AQI:</strong> <span style={{ color: (sel?.aqi || 100) <= 50 ? '#22c55e' : (sel?.aqi || 100) <= 100 ? '#f59e0b' : (sel?.aqi || 100) <= 150 ? '#f97316' : '#ef4444' }}>{sel?.aqi}</span>
                </p>
                <p style={{color: '#7589a8', fontSize: '12px'}}>
                  💡 Tip: Click on a different route card above to compare alternatives. 
                  The {routes[0]?.name} option is {routes[0]?.time - routes[2]?.time} minutes faster but covers {routes[2]?.dist - routes[0]?.dist} km more distance.
                </p>
              </div>
            </div>

            {/* Turn-by-Turn Directions */}
            {sel?.turnInstructions && sel.turnInstructions.length > 0 && (
              <div className="directions-card" style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '15px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '12px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <span style={{fontSize: '20px'}}>🧭</span>
                  <div>
                    <div style={{fontSize: '15px', fontWeight: 600}}>Turn-by-Turn Directions</div>
                    <div style={{fontSize: '11px', color: '#7589a8'}}>{sel.turnInstructions.length} steps</div>
                  </div>
                </div>
                <div style={{maxHeight: '300px', overflowY: 'auto'}} className="timeline">
                  {sel.turnInstructions.map((step, idx) => (
                    <div key={idx} className="timeline-item" style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '10px 0',
                      borderBottom: idx < sel.turnInstructions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                    }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: idx === 0 ? 'var(--green)' : idx === sel.turnInstructions.length - 1 ? 'var(--red)' : 'var(--teal)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'white',
                        flexShrink: 0
                      }}>
                        {idx === 0 ? 'S' : idx === sel.turnInstructions.length - 1 ? 'D' : idx + 1}
                      </div>
                      <div style={{flex: 1}}>
                        <div style={{fontSize: '14px', fontWeight: 500, marginBottom: '2px'}}>
                          {step.instruction || 'Continue'}
                        </div>
                        <div style={{fontSize: '12px', color: '#7589a8', display: 'flex', gap: '10px'}}>
                          <span>{(step.distance || 0).toFixed(0)} m</span>
                          <span>•</span>
                          <span>{Math.round((step.duration || 0) / 60)} min</span>
                          {step.maneuver && (
                            <>
                              <span>•</span>
                              <span style={{textTransform: 'capitalize'}}>{step.maneuver}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!routes && !loading && (
          <div className="empty-state">
            <div className="empty-icon">🗺️</div>
            <div className="empty-title gradient-text">Plan your route</div>
            <div style={{fontSize:13}}>Enter your start and destination to get pollution-aware route recommendations</div>
            <div style={{marginTop:20,display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap'}}>
              {[
                {icon:'🛣️',text:'AI-Powered Routing'},
                {icon:'⚡',text:'Fast & Accurate'},
                {icon:'🇮🇳',text:'All India Coverage'},
                {icon:'🌬️',text:'AQI-Aware Navigation'},
                {icon:'🏥',text:'Health Profiles'},
                {icon:'📊',text:'Route Comparison'},
              ].map(f=> (
                <div key={f.text} style={{fontSize:12,color:'#7589a8',display:'flex',alignItems:'center',gap:5}}>
                  <span style={{fontSize:14}}>{f.icon}</span> {f.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <FloatingActions
        onShare={handleShare}
        onExport={handleExport}
        onVoiceSearch={handleVoiceSearch}
        onReset={handleReset}
      />

      {/* Toast Notifications */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="toast"
            style={{ animation: 'slideIn 0.3s ease, fadeIn 0.3s ease' }}
          >
            <span style={{ fontSize: '16px' }}>{toast.icon}</span>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoutePlanner;
