import asyncio
import httpx

async def test_api():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            'http://localhost:8000/get-hybrid-routes',
            json={
                'source': {'lat': 19.0760, 'lng': 72.8777},
                'destination': {'lat': 18.5204, 'lng': 73.8567},
                'health_profile': 'healthy',
                'transport_mode': 'driving'
            },
            timeout=30
        )
        print(f'Status: {response.status_code}')
        data = response.json()
        print(f"Routes: {len(data['routes'])}")
        for r in data['routes']:
            print(f"  {r['route_type']}: {r['distance_meters']/1000:.1f}km, {r['duration_seconds']/60:.0f}min, path points: {len(r['path'])}")

if __name__ == "__main__":
    asyncio.run(test_api())
