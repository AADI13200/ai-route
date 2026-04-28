import asyncio
import httpx

async def test_transport_modes():
    """Test different transport modes get different routes."""
    
    modes = ['driving', 'walking', 'cycling']
    
    for mode in modes:
        print(f"\n{'='*50}")
        print(f"Testing {mode.upper()} mode")
        print(f"{'='*50}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'http://localhost:8000/get-hybrid-routes',
                json={
                    'source': {'lat': 19.0760, 'lng': 72.8777},  # Mumbai
                    'destination': {'lat': 18.5204, 'lng': 73.8567},  # Pune
                    'health_profile': 'healthy',
                    'transport_mode': mode
                },
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"Routes found: {len(data['routes'])}")
                
                for r in data['routes']:
                    print(f"\n  {r['route_type'].upper()}:")
                    print(f"    Distance: {r['distance_meters']/1000:.1f} km")
                    print(f"    Duration: {r['duration_seconds']/60:.0f} min")
                    print(f"    Avg AQI: {r['avg_aqi']:.0f}")
                    print(f"    Max AQI: {r['max_aqi']:.0f}")
                    print(f"    Description: {r['description']}")
            else:
                print(f"Error: {response.status_code}")

if __name__ == "__main__":
    asyncio.run(test_transport_modes())
