import cv2
import requests
import time
import os
import datetime
import random
from concurrent.futures import ThreadPoolExecutor

# Configuration
MODEL_API_URL = "https://vishalbhagat01-railway.hf.space/predict"
BACKEND_API_URL = "http://localhost:8000/analyze"
CONFIDENCE_THRESHOLD = 70.0  # Safety threshold
CAMERA_SOURCE = 0 # 0 for webcam, or path to video file
SAVE_DIR = "captured_defects"

# Ensure save directory exists
os.makedirs(SAVE_DIR, exist_ok=True)

# Simulated Location Data (Starting point)
current_lat = 28.6139
current_lon = 77.2090
current_chainage_km = 100.0
direction = 1 # moving forward

def get_location_metadata():
    """Simulates getting GPS and Chainage data."""
    global current_lat, current_lon, current_chainage_km
    
    # Simulate movement
    current_lat += random.uniform(-0.0001, 0.0001)
    current_lon += random.uniform(-0.0001, 0.0001)
    current_chainage_km += 0.01
    
    return {
        "latitude": round(current_lat, 6),
        "longitude": round(current_lon, 6),
        "chainage": f"KM {current_chainage_km:.2f}",
        "nearest_station": "New Delhi Central"
    }

def process_frame(frame):
    """
    1. Encodes frame.
    2. Sends to Model API.
    3. If defective, sends to Backend.
    """
    try:
        _, img_encoded = cv2.imencode('.jpg', frame)
        files = {'file': ('image.jpg', img_encoded.tobytes(), 'image/jpeg')}
        
        # Call Model API
        response = requests.post(MODEL_API_URL, files=files)
        data = response.json()
        
        # Parse Response (Based on model.html structure)
        # Expected: {"prediction": "Defective"|"Non Defective", "confidence": <int/float>}
        prediction = data.get("prediction", "Unknown")
        confidence = float(data.get("confidence", 0))
        
        print(f"Prediction: {prediction}, Confidence: {confidence}%")
        
        if prediction == "Defective" and confidence > CONFIDENCE_THRESHOLD:
            print(">>> DEFECT DETECTED! Processing...")
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"defect_{timestamp}.jpg"
            filepath = os.path.join(SAVE_DIR, filename)
            
            # Save annotated image (draw text on it)
            annotated_frame = frame.copy()
            cv2.putText(annotated_frame, f"DEFECT: {confidence}%", (10, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            cv2.imwrite(filepath, annotated_frame)
            
            # Get location
            loc = get_location_metadata()
            
            # Send to Backend
            payload = {
                "defect_type": "Track Defect", # Model generic name
                "confidence": confidence,
                "image_url": os.path.abspath(filepath), # In real scenarios, upload to cloud and get URL
                "latitude": loc["latitude"],
                "longitude": loc["longitude"],
                "chainage": loc["chainage"],
                "nearest_station": loc["nearest_station"]
            }
            
            # Using ThreadPool to not block the video loop significantly
            requests.post(BACKEND_API_URL, json=payload)
            print(">>> Sent to backend analysis.")
            
    except Exception as e:
        print(f"Error processing frame: {e}")

def main():
    cap = cv2.VideoCapture(CAMERA_SOURCE)
    
    if not cap.isOpened():
        print("Error: Could not open camera.")
        return

    frame_count = 0
    # Process every Nth frame to avoid overwhelming API
    PROCESS_EVERY_N_FRAMES = 30 
    
    executor = ThreadPoolExecutor(max_workers=2)

    print("Starting Vision Agent...")
    print(f"Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count += 1
        
        # Display the stream
        cv2.imshow('Railway Inspection Feed', frame)
        
        if frame_count % PROCESS_EVERY_N_FRAMES == 0:
            executor.submit(process_frame, frame.copy())
            
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()
    executor.shutdown()

if __name__ == "__main__":
    main()
