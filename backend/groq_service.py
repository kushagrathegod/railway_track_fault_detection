import os
import json
from groq import Groq

# Initialize Groq Client
client = None

def get_client():
    global client
    if not client:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            print("❌ GROQ_API_KEY not found in environment variables!")
            return None
        client = Groq(api_key=api_key)
    return client

def analyze_defect(defect_type, confidence, location_info):
    """
    Uses Groq (Llama3-8b or similar) to analyze the defect.
    """
    client = get_client()
    if not client:
        return {
            "root_cause": "API Key Missing",
            "severity": "High",
            "immediate_action": "Check Server Configuration",
            "resolution_steps": "Add GROQ_API_KEY to .env file",
            "preventive_recommendations": "N/A"
        }

    prompt = f"""
    You are a Railway Safety Expert. A defect has been detected on the track.
    
    Details:
    - Defect Type: {defect_type}
    - Confidence: {confidence}%
    - Location: {location_info}
    
    Please provide a strict JSON response with the following keys:
    - "root_cause": Possible reasons for this defect (2-3 sentences).
    - "severity": MUST be EXACTLY one of: "Low", "High", or "Critical".
    - "immediate_action": What needs to be done immediately? (1-2 sentences)
    - "resolution_steps": Step-by-step maintenance/repair instructions (3-5 steps).
    - "preventive_recommendations": How to prevent this in the future.
    
    IMPORTANT: Return ONLY valid JSON. No markdown formatting (no ```json).
    """

    try:
        completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant that outputs only valid JSON strings."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        response_content = completion.choices[0].message.content
        print(f"Groq Response: {response_content}")

        # Basic Cleanup if model ignores system prompt
        text = response_content.strip()
        import re
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            text = match.group(0)
        
        analysis = json.loads(text)
        
        # Ensure Severity is Capitalized
        if "severity" in analysis:
            analysis["severity"] = analysis["severity"].capitalize()

        return analysis

    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return {
            "root_cause": "AI Analysis Failed",
            "severity": "High",
            "immediate_action": "Manual Inspection Required",
            "resolution_steps": "Contact Technical Support",
            "preventive_recommendations": "Check API Quota or Connection"
        }
