import asyncio
import sys
sys.path.insert(0, 'd:\\sbdhjhbsggkdkfjgnjenhnstkj\\nebulax\\backend')

from api.osrm_service import osrm_service

async def test():
    print('Testing OSRM routes...')
    routes = await osrm_service.get_multiple_routes(
        origin=(19.0760, 72.8777),
        destination=(18.5204, 73.8567),
        transport_mode='driving'
    )
    print(f'Got {len(routes)} routes')
    for r in routes:
        print(f"  {r.get('route_type')}: {r.get('distance_meters', 0)/1000:.1f}km")

if __name__ == "__main__":
    asyncio.run(test())
