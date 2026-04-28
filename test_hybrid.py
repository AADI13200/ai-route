import asyncio
import sys
sys.path.insert(0, 'd:\\sbdhjhbsggkdkfjgnjenhnstkj\\nebulax\\backend')

from utils.hybrid_routing_engine import hybrid_routing_engine

async def test():
    print('Testing hybrid engine...')
    routes = await hybrid_routing_engine.calculate_routes(
        source=(19.0760, 72.8777),
        destination=(18.5204, 73.8567),
        transport_mode='driving'
    )
    print(f'Got {len(routes)} routes')
    for r in routes:
        print(f"  {r.route_type}: {r.distance_meters/1000:.1f}km, {r.duration_seconds/60:.0f}min, {len(r.path)} path points")

if __name__ == "__main__":
    asyncio.run(test())
