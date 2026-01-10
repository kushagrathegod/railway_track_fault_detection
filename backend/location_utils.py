import math

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees).
    Returns distance in kilometers.
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    
    return c * r

def find_nearest_station(defect_lat, defect_lon, db):
    """
    Find the nearest station to a defect location.
    Returns the Station object.
    """
    from database import Station
    
    stations = db.query(Station).all()
    
    if not stations:
        return None
    
    nearest_station = None
    min_distance = float('inf')
    
    for station in stations:
        distance = haversine_distance(
            defect_lat, defect_lon,
            station.latitude, station.longitude
        )
        
        if distance < min_distance:
            min_distance = distance
            nearest_station = station
    
    return nearest_station
