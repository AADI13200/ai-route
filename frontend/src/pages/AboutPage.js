import React from 'react';

const AboutPage = () => {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered AQI Prediction',
      description: 'Machine learning model using Random Forest regression to predict air quality based on weather conditions including temperature, humidity, wind speed, and historical data.'
    },
    {
      icon: '🗺️',
      title: 'Smart Routing Algorithm',
      description: 'Custom Dijkstra\'s algorithm implementation that weights routes by AQI exposure, not just distance. Considers real-time pollution data for path calculation.'
    },
    {
      icon: '💚',
      title: 'Health Profile System',
      description: 'Personalized routing based on your health sensitivity. Asthma and cardiac profiles get stricter AQI thresholds and cleaner route prioritization.'
    },
    {
      icon: '📊',
      title: 'Exposure Risk Scoring',
      description: 'Risk = AQI × Time × Health Weight formula calculates your total pollution exposure for informed decision-making.'
    },
    {
      icon: '🏃',
      title: 'Fitness Mode',
      description: 'Special mode for walkers and runners that maximizes clean air exposure over speed, perfect for outdoor exercise in urban environments.'
    },
    {
      icon: '⚡',
      title: 'FastAPI Backend',
      description: 'High-performance Python backend with async request handling, supporting thousands of concurrent route calculations.'
    }
  ];

  const techStack = [
    { category: 'Frontend', items: ['React 18', 'Tailwind CSS', 'Leaflet Maps', 'Axios'] },
    { category: 'Backend', items: ['Python FastAPI', 'Uvicorn', 'Pydantic', 'HTTPX'] },
    { category: 'AI/ML', items: ['Scikit-learn', 'Pandas', 'NumPy', 'Joblib'] },
    { category: 'APIs', items: ['OpenWeather API', 'Open-Meteo', 'OpenStreetMap'] }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">About PurePath</h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
          Building healthier cities through intelligent, pollution-aware navigation technology.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-gradient-to-br from-blue-600/20 to-cyan-500/20 rounded-2xl p-8 mb-12 border border-blue-500/30">
        <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
        <p className="text-slate-300 leading-relaxed">
          Air pollution causes millions of premature deaths globally each year. PurePath empowers 
          individuals to make informed decisions about their daily commute by providing 
          pollution-aware route recommendations. We believe that everyone deserves to breathe 
          clean air, and technology can help us navigate towards that goal.
        </p>
      </div>

      {/* Features Grid */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Technology Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {techStack.map((stack, index) => (
            <div key={index} className="bg-slate-800 rounded-xl p-4">
              <h3 className="text-cyan-400 font-semibold mb-3">{stack.category}</h3>
              <ul className="space-y-1">
                {stack.items.map((item, i) => (
                  <li key={i} className="text-slate-300 text-sm flex items-center">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-2"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Formula */}
      <div className="bg-slate-800 rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Exposure Risk Formula</h2>
        <div className="bg-slate-900 rounded-xl p-6 font-mono text-center mb-4">
          <p className="text-2xl text-cyan-400">
            Risk = AQI × Time × Health_Weight
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-cyan-400 font-semibold mb-1">AQI</p>
            <p className="text-slate-300">Air Quality Index (0-500) along the route</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-cyan-400 font-semibold mb-1">Time</p>
            <p className="text-slate-300">Exposure duration in minutes</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-cyan-400 font-semibold mb-1">Health Weight</p>
            <p className="text-slate-300">1.0 (normal), 2.5 (asthma), 3.0 (cardiac)</p>
          </div>
        </div>
      </div>

      {/* AQI Scale */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">AQI Scale Reference</h2>
        <div className="space-y-2">
          {[
            { range: '0-50', color: '#22c55e', label: 'Good', desc: 'Air quality is satisfactory' },
            { range: '51-100', color: '#eab308', label: 'Moderate', desc: 'Acceptable, but sensitive groups should watch' },
            { range: '101-150', color: '#f97316', label: 'Unhealthy for Sensitive', desc: 'Sensitive groups may experience effects' },
            { range: '151-200', color: '#ef4444', label: 'Unhealthy', desc: 'Everyone may experience health effects' },
            { range: '201-300', color: '#a855f7', label: 'Very Unhealthy', desc: 'Health warnings of emergency conditions' },
            { range: '301+', color: '#7f1d1d', label: 'Hazardous', desc: 'Emergency conditions, entire population affected' }
          ].map((aqi, index) => (
            <div key={index} className="flex items-center bg-slate-800 rounded-lg p-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xs mr-4"
                style={{ backgroundColor: aqi.color }}
              >
                {aqi.range}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">{aqi.label}</p>
                <p className="text-slate-400 text-sm">{aqi.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Author / GitHub */}
      <div className="bg-slate-800 rounded-2xl p-8 mb-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Developer</h2>
        <a
          href="https://github.com/AADI13200"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" className="text-white">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          <span className="text-white font-semibold">github.com/AADI13200</span>
        </a>
      </div>

      {/* Footer */}
      <div className="text-center text-slate-400 text-sm">
        <p>PurePath - AI-Powered Pollution-Aware Route Planning System</p>
        <p className="mt-1">Built with React, FastAPI & Scikit-learn</p>
      </div>
    </div>
  );
};

export default AboutPage;
