import cv2
from dotenv import load_dotenv

load_dotenv()
import requests
import time
import os
import datetime
import random
from concurrent.futures import ThreadPoolExecutor
import sys
import argparse
try:
    import geocoder
    GEOCODER_AVAILABLE = True
except ImportError:
    GEOCODER_AVAILABLE = False
    print("⚠️  geocoder not installed. Install with: pip install geocoder")
    print("   Falling back to manual location input.")

# Configuration
MODEL_API_URL = os.getenv("MODEL_API_URL", "https://vishalbhagat01-railway.hf.space/predict")
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000/analyze")
CONFIDENCE_THRESHOLD = 70.0  # Safety threshold
CAMERA_SOURCE = 0 # 0 for webcam, or path to video file
SAVE_DIR = "captured_defects"

# Ensure save directory exists
os.makedirs(SAVE_DIR, exist_ok=True)

# Location Data
current_lat = None
current_lon = None
location_initialized = False

def get_actual_location():
    """Gets actual GPS location using IP geolocation."""
    if not GEOCODER_AVAILABLE:
        return None
    
    try:
        print("📍 Fetching your current location...")
        g = geocoder.ip('me')  # IP-based geolocation
        
        if g.ok:
            print(f"✅ Location found: {g.city}, {g.country}")
            return {
                "latitude": g.lat,
                "longitude": g.lng,
                "city": g.city or "Unknown",
                "country": g.country or "Unknown"
            }
        else:
            print("⚠️  Could not fetch location automatically.")
            return None
    except Exception as e:
        print(f"⚠️  Error fetching location: {e}")
        return None

def initialize_location():
    """Initialize location on first use."""
    global current_lat, current_lon, location_initialized
    
    if location_initialized:
        return
    
    print("\n" + "="*60)
    print("📍 LOCATION SETUP")
    print("="*60)
    
    # Try to get actual location first
    actual_loc = get_actual_location()
    
    if actual_loc:
        print(f"\nUsing your current location:")
        print(f"  📍 {actual_loc['city']}, {actual_loc['country']}")
        print(f"  🗺️  Coordinates: {actual_loc['latitude']}, {actual_loc['longitude']}")
        
        use_actual = input("\nUse this location? (y/n): ").strip().lower()
        
        if use_actual == 'y':
            current_lat = actual_loc['latitude']
            current_lon = actual_loc['longitude']
            location_initialized = True
            return
    
    # Manual input fallback
    print("\n📝 Manual Location Input")
    print("   (Leave blank to use default: New Delhi - 28.6139, 77.2090)")
    
    lat_input = input("\nEnter Latitude (or press Enter for default): ").strip()
    lon_input = input("Enter Longitude (or press Enter for default): ").strip()
    
    if lat_input and lon_input:
        try:
            current_lat = float(lat_input)
            current_lon = float(lon_input)
            print(f"✅ Using manual location: {current_lat}, {current_lon}")
        except ValueError:
            print("⚠️  Invalid input. Using default location.")
            current_lat = 28.6139
            current_lon = 77.2090
    else:
        current_lat = 28.6139
        current_lon = 77.2090
        print("✅ Using default location: New Delhi (28.6139, 77.2090)")
    
    location_initialized = True
    print("="*60 + "\n")

def get_location_metadata():
    """Gets GPS data with actual or simulated location."""
    global current_lat, current_lon
    
    # Initialize location on first call
    if not location_initialized:
        initialize_location()
    
    # Simulate small movement (drone moving along track)
    current_lat += random.uniform(-0.0001, 0.0001)
    current_lon += random.uniform(-0.0001, 0.0001)
    
    return {
        "latitude": round(current_lat, 6),
        "longitude": round(current_lon, 6),
        "nearest_station": "Detected Location"
    }

def process_frame(frame, save_image=True):
    """
    1. Encodes frame.
    2. Sends to Model API.
    3. If defective, sends to Backend.
    
    Args:
        frame: Image frame to process
        save_image: Whether to save the image (for uploaded images, set to False initially)
    """
    try:
        _, img_encoded = cv2.imencode('.jpg', frame)
        files = {'file': ('image.jpg', img_encoded.tobytes(), 'image/jpeg')}
        
        # Call Model API
        print("📡 Calling ML model API...")
        response = requests.post(MODEL_API_URL, files=files, timeout=30)
        data = response.json()
        
        # Parse Response
        prediction = data.get("prediction", "Unknown")
        confidence = float(data.get("confidence", 0))
        
        print(f"📊 Prediction: {prediction}, Confidence: {confidence}%")
        
        if prediction == "Defective" and confidence > CONFIDENCE_THRESHOLD:
            print("🚨 DEFECT DETECTED! Processing...")
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"defect_{timestamp}.jpg"
            filepath = os.path.join(SAVE_DIR, filename)
            
            # Save annotated image
            annotated_frame = frame.copy()
            cv2.putText(annotated_frame, f"DEFECT: {confidence}%", (10, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            cv2.imwrite(filepath, annotated_frame)
            print(f"💾 Image saved: {filepath}")
            
            # Get location
            loc = get_location_metadata()
            
            # Send to Backend
            payload = {
                "defect_type": "Track Defect",
                "confidence": confidence,
                "image_url": os.path.abspath(filepath),
                "latitude": loc["latitude"],
                "longitude": loc["longitude"],
                "nearest_station": loc["nearest_station"]
            }
            
            print("📤 Sending to backend for analysis...")
            response = requests.post(BACKEND_API_URL, json=payload, timeout=30)
            
            if response.status_code == 200:
                print(f"✅ Sent to backend successfully!")
                result = response.json()
                print(f"   Severity: {result.get('severity')}")
                print(f"   Assigned Station: {result.get('assigned_station_id')}")
            else:
                print(f"❌ Backend Error: {response.status_code} - {response.text}")
        else:
            print(f"✓ No defect detected (Confidence: {confidence}%)")
            
    except requests.exceptions.Timeout:
        print("⏱️ Request timed out. The ML model API might be slow or unavailable.")
    except requests.exceptions.ConnectionError:
        print("🔌 Connection error. Make sure the backend is running.")
    except Exception as e:
        print(f"❌ Error processing frame: {e}")

def webcam_mode():
    """Live webcam capture mode"""
    cap = cv2.VideoCapture(CAMERA_SOURCE)
    
    if not cap.isOpened():
        print("❌ Error: Could not open camera.")
        return

    frame_count = 0
    PROCESS_EVERY_N_FRAMES = 30 
    
    executor = ThreadPoolExecutor(max_workers=2)

    print("=" * 60)
    print("🎥 WEBCAM MODE - Starting Vision Agent...")
    print("=" * 60)
    print(f"📹 Press 'q' to quit")
    print(f"🔄 Processing every {PROCESS_EVERY_N_FRAMES} frames")
    print("=" * 60)

    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count += 1
        
        # Display the stream
        cv2.imshow('Railway Inspection Feed', frame)
        
        if frame_count % PROCESS_EVERY_N_FRAMES == 0:
            print(f"\n⏱️ Frame {frame_count} - Processing...")
            executor.submit(process_frame, frame.copy())
            
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()
    executor.shutdown()
    print("\n✅ Webcam mode stopped.")

def image_upload_mode():
    """Manual image upload mode for testing"""
    print("=" * 60)
    print("📁 IMAGE UPLOAD MODE")
    print("=" * 60)
    
    while True:
        print("\nOptions:")
        print("  1. Upload a specific image file")
        print("  2. Process all images in a folder")
        print("  3. Return to main menu")
        
        choice = input("\nEnter your choice (1-3): ").strip()
        
        if choice == "1":
            # Single image
            image_path = input("Enter the full path to the image: ").strip().strip('"')
            
            if not os.path.exists(image_path):
                print(f"❌ File not found: {image_path}")
                continue
            
            print(f"\n📸 Loading image: {image_path}")
            frame = cv2.imread(image_path)
            
            if frame is None:
                print("❌ Could not read image. Make sure it's a valid image file.")
                continue
            
            print("🔍 Processing image...")
            process_frame(frame)
            print("\n✅ Image processed!")
            
        elif choice == "2":
            # Folder of images
            folder_path = input("Enter the folder path: ").strip().strip('"')
            
            if not os.path.exists(folder_path):
                print(f"❌ Folder not found: {folder_path}")
                continue
            
            # Get all image files
            image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
            images = [f for f in os.listdir(folder_path) 
                     if os.path.splitext(f.lower())[1] in image_extensions]
            
            if not images:
                print(f"❌ No images found in: {folder_path}")
                continue
            
            print(f"\n📁 Found {len(images)} image(s)")
            print("🔄 Processing...")
            
            for i, img_file in enumerate(images, 1):
                img_path = os.path.join(folder_path, img_file)
                print(f"\n[{i}/{len(images)}] Processing: {img_file}")
                
                frame = cv2.imread(img_path)
                if frame is not None:
                    process_frame(frame)
                else:
                    print(f"  ⚠️ Skipped (could not read)")
            
            print(f"\n✅ Processed {len(images)} image(s)!")
            
        elif choice == "3":
            break
        else:
            print("❌ Invalid choice. Please enter 1, 2, or 3.")

def drone_mode():
    """Drone mode: Non-interactive webcam processing for background operation"""
    cap = cv2.VideoCapture(CAMERA_SOURCE)
    
    if not cap.isOpened():
        print("❌ Error: Could not open camera.")
        return

    frame_count = 0
    PROCESS_EVERY_N_FRAMES = 30 
    
    executor = ThreadPoolExecutor(max_workers=2)

    print("=" * 60)
    print("🚁 DRONE MODE - Starting Vision Agent in background...")
    print("=" * 60)
    print(f"🔄 Processing every {PROCESS_EVERY_N_FRAMES} frames")
    print("=" * 60)

    # Use default location for drone mode to avoid interactive input
    global current_lat, current_lon, location_initialized
    current_lat = 28.6139
    current_lon = 77.2090
    location_initialized = True
    print("✅ Using default location: New Delhi (28.6139, 77.2090)")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_count += 1
            
            if frame_count % PROCESS_EVERY_N_FRAMES == 0:
                print(f"\n⏱️ Frame {frame_count} - Processing...")
                executor.submit(process_frame, frame.copy())
                
            # No cv2.imshow or cv2.waitKey(1) in drone mode to avoid needing a GUI/input
            time.sleep(0.01) # Small sleep to avoid maxing CPU
            
    except KeyboardInterrupt:
        print("\n🛑 Stopping Drone Mode...")
    finally:
        cap.release()
        executor.shutdown()
        print("\n✅ Drone mode stopped.")

def main():
    """Main entry point with mode selection"""
    parser = argparse.ArgumentParser(description='Railway Defect Detection Vision Agent')
    parser.add_argument('--mode', choices=['webcam', 'upload', 'drone'], 
                       help='Run mode: webcam (live), upload (test images), or drone (background)')
    
    args = parser.parse_args()
    
    # If mode specified via command line, use it
    if args.mode:
        if args.mode == 'webcam':
            webcam_mode()
        elif args.mode == 'drone':
            drone_mode()
        else:
            image_upload_mode()
        return
    
    # Otherwise, show interactive menu
    while True:
        print("\n" + "=" * 60)
        print("🚂 RAILWAY DEFECT DETECTION - VISION AGENT")
        print("=" * 60)
        print("\nSelect Mode:")
        print("  1. 🎥 Webcam Mode (Live video capture)")
        print("  2. 📁 Image Upload Mode (Test with your own images)")
        print("  3. ❌ Exit")
        print("=" * 60)
        
        choice = input("\nEnter your choice (1-3): ").strip()
        
        if choice == "1":
            webcam_mode()
        elif choice == "2":
            image_upload_mode()
        elif choice == "3":
            print("\n👋 Goodbye!")
            break
        else:
            print("\n❌ Invalid choice. Please enter 1, 2, or 3.")

if __name__ == "__main__":
    main()
