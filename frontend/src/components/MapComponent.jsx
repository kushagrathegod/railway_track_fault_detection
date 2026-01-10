import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom Icons
const createIcon = (color) => {
    return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
};

const redIcon = createIcon('red');
const yellowIcon = createIcon('gold');
const blueIcon = createIcon('blue');

const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, 15);
    }, [center, map]);
    return null;
};

const MapComponent = ({ defects, selectedDefect, onSelectDefect }) => {
    const defaultCenter = [28.6139, 77.2090]; // New Delhi
    const center = selectedDefect
        ? [selectedDefect.latitude, selectedDefect.longitude]
        : (defects.length > 0 ? [defects[0].latitude, defects[0].longitude] : defaultCenter);

    return (
        <div className="map-container">
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {selectedDefect && <RecenterMap center={[selectedDefect.latitude, selectedDefect.longitude]} />}

                {defects.map((defect) => {
                    let icon = blueIcon;
                    if (defect.severity === 'Critical') icon = redIcon;
                    else if (defect.severity === 'High') icon = yellowIcon;

                    return (
                        <Marker
                            key={defect.id}
                            position={[defect.latitude || 0, defect.longitude || 0]}
                            icon={icon}
                            eventHandlers={{
                                click: () => onSelectDefect(defect),
                            }}
                        >
                            <Popup className="custom-popup">
                                <strong>{defect.defect_type}</strong><br />
                                Severity: <span style={{ color: defect.severity === 'Critical' ? 'red' : 'black' }}>{defect.severity}</span> <br />
                                {defect.nearest_station}
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
