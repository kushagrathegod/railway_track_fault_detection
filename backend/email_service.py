import smtplib
from email.message import EmailMessage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
import os

def send_alert(defect_data, recipient_email=None, station_name=None):
    """
    Sends an email alert for critical defects with image attachment.
    
    Args:
        defect_data: Dictionary containing defect information
        recipient_email: Email address of the recipient (station master)
        station_name: Name of the station (for email subject)
    """
    sender_email = os.getenv("EMAIL_USER")
    sender_password = os.getenv("EMAIL_PASS")
    
    # Use provided recipient or fall back to env variable
    if not recipient_email:
        recipient_email = os.getenv("ALERT_RECIPIENT")

    if not sender_email or not sender_password:
        print("Email credentials not set. Skipping email alert.")
        return
    
    if not recipient_email:
        print("No recipient email provided. Skipping email alert.")
        return

    # Create multipart message
    msg = MIMEMultipart('related')
    
    # Include station name in subject if provided
    location_info = station_name if station_name else defect_data.get('nearest_station', 'Unknown Location')
    msg['Subject'] = f"🚨 CRITICAL: Railway Defect at {location_info}"
    msg['From'] = sender_email
    msg['To'] = recipient_email

    # Create HTML content
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
            <h2 style="color: #dc3545; border-bottom: 3px solid #dc3545; padding-bottom: 10px;">
                ⚠️ CRITICAL DEFECT DETECTED ⚠️
            </h2>
            
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Defect Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold; width: 40%;">Type:</td>
                        <td style="padding: 8px;">{defect_data['defect_type']}</td>
                    </tr>
                    <tr style="background-color: #f8f9fa;">
                        <td style="padding: 8px; font-weight: bold;">Confidence:</td>
                        <td style="padding: 8px;">{defect_data['confidence']}%</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Location:</td>
                        <td style="padding: 8px;">{defect_data.get('latitude')}, {defect_data.get('longitude')}</td>
                    </tr>
                    <tr style="background-color: #f8f9fa;">
                        <td style="padding: 8px; font-weight: bold;">Nearest Station:</td>
                        <td style="padding: 8px;">{defect_data.get('nearest_station')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Timestamp:</td>
                        <td style="padding: 8px;">{defect_data.get('timestamp')}</td>
                    </tr>
                    <tr style="background-color: #f8f9fa;">
                        <td style="padding: 8px; font-weight: bold;">Severity:</td>
                        <td style="padding: 8px; color: #dc3545; font-weight: bold;">{defect_data.get('severity')}</td>
                    </tr>
                </table>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #856404; margin-top: 0;">⚡ IMMEDIATE ACTION REQUIRED</h3>
                <p style="margin: 0;">{defect_data.get('action_required')}</p>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">🔧 Resolution Steps</h3>
                <p style="margin: 0; white-space: pre-line;">{defect_data.get('resolution_steps')}</p>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">📷 Defect Image</h3>
                <img src="cid:defect_image" style="max-width: 100%; height: auto; border-radius: 5px; border: 2px solid #dee2e6;" />
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 0.9em;">
                <p>This is an automated alert from the Railway Defect Detection System.</p>
                <p style="font-weight: bold; color: #dc3545;">Please take immediate action.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version
    text_content = f"""
    ⚠️ CRITICAL DEFECT DETECTED ⚠️
    
    Type: {defect_data['defect_type']}
    Confidence: {defect_data['confidence']}%
    Location: {defect_data.get('latitude')}, {defect_data.get('longitude')} (Near {defect_data.get('nearest_station')})
    Timestamp: {defect_data.get('timestamp')}
    
    SEVERITY: {defect_data.get('severity')}
    
    IMMEDIATE ACTION REQUIRED:
    {defect_data.get('action_required')}
    
    RESOLUTION STEPS:
    {defect_data.get('resolution_steps')}
    
    (See attached image for visual reference)
    
    ---
    This is an automated alert from the Railway Defect Detection System.
    Please take immediate action.
    """
    
    # Attach both versions
    msg.attach(MIMEText(text_content, 'plain'))
    msg.attach(MIMEText(html_content, 'html'))
    
    # Attach image if file exists
    image_path = defect_data.get('image_url')
    if image_path and os.path.exists(image_path):
        try:
            with open(image_path, 'rb') as img_file:
                img_data = img_file.read()
                image = MIMEImage(img_data)
                image.add_header('Content-ID', '<defect_image>')
                image.add_header('Content-Disposition', 'inline', filename=os.path.basename(image_path))
                msg.attach(image)
            print(f"✓ Image attached: {os.path.basename(image_path)}")
        except Exception as e:
            print(f"⚠ Could not attach image: {e}")
    else:
        print(f"⚠ Image file not found: {image_path}")

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(sender_email, sender_password)
            smtp.send_message(msg)
        print(f"✓ Alert email sent successfully to {recipient_email}")
    except Exception as e:
        print(f"✗ Failed to send email: {e}")

