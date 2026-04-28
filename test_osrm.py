import asyncio
from api.osrm_service import osrm_service

async def test():
    print("Testing OSRM route from Mumbai to Pune...")
    route = await osrm_service.get_route(
        origin=(19.0760, 72.8777),  # Mumbai
        destination=(18.5204, 73.8567),  # Pune
        route_type='balanced'
    )
    if route:
        print(f"Success! Distance: {route['distance_meters']/1000:.1f} km")
        print(f"Duration: {route['duration_seconds']/60:.0f} min")
        print(f"Path points: {len(route['path'])}")
        print(f"First point: {route['path'][0]}")
        print(f"Last point: {route['path'][-1]}")
    else:
        print("Failed to get route")

if __name__ == "__main__":
    asyncio.run(test())
