"""
Google Maps enrichment: geocode office address, find nearest transit station,
and compute distance/duration via Distance Matrix API.
"""
import httpx
from app.config import get_settings


async def get_office_info(address: str) -> dict:
    settings = get_settings()
    if not settings.google_maps_api_key or not address:
        return {
            "address": address,
            "latitude": None,
            "longitude": None,
            "nearest_metro": None,
            "nearest_bus": None,
            "nearest_railway": None,
            "distance_from_station_km": None,
            "transportation_notes": "Set GOOGLE_MAPS_API_KEY in backend/.env to enable commute data.",
        }  # TODO(key)

    async with httpx.AsyncClient(timeout=10) as client:
        geo = await client.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={"address": address, "key": settings.google_maps_api_key},
        )
        geo_data = geo.json()
        if not geo_data.get("results"):
            return {"address": address}

        location = geo_data["results"][0]["geometry"]["location"]
        lat, lng = location["lat"], location["lng"]

        nearby = await client.get(
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
            params={
                "location": f"{lat},{lng}",
                "rankby": "distance",
                "type": "transit_station",
                "key": settings.google_maps_api_key,
            },
        )
        nearby_data = nearby.json().get("results", [])
        nearest_station = nearby_data[0]["name"] if nearby_data else None

        distance_km = None
        if nearest_station and nearby_data:
            station_loc = nearby_data[0]["geometry"]["location"]
            dm = await client.get(
                "https://maps.googleapis.com/maps/api/distancematrix/json",
                params={
                    "origins": f"{lat},{lng}",
                    "destinations": f"{station_loc['lat']},{station_loc['lng']}",
                    "key": settings.google_maps_api_key,
                },
            )
            rows = dm.json().get("rows", [])
            if rows and rows[0]["elements"][0]["status"] == "OK":
                distance_km = rows[0]["elements"][0]["distance"]["value"] / 1000

        return {
            "address": address,
            "latitude": lat,
            "longitude": lng,
            "nearest_metro": nearest_station,
            "nearest_bus": None,
            "nearest_railway": None,
            "distance_from_station_km": distance_km,
            "transportation_notes": None,
        }
