#!/usr/bin/env python3
"""
Marker OCR Microservice
Runs on port 8001, accepts PDF upload, returns Markdown
"""
from flask import Flask, request, jsonify
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered
import tempfile
import os

app = Flask(__name__)

# Initialize Marker model (load once at startup)
print("Loading Marker models...")
model_dict = create_model_dict()
converter = PdfConverter(artifact_dict=model_dict)
print("Marker ready!")


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "marker-ocr"})


@app.route('/convert', methods=['POST'])
def convert_pdf():
    """
    POST /convert
    Body: multipart/form-data with 'file' field (PDF)
    Returns: JSON with markdown text
    """
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name
        
        try:
            # Convert with Marker
            rendered = converter(tmp_path)
            text, metadata, images = text_from_rendered(rendered)
            
            return jsonify({
                "success": True,
                "markdown": text,
                "metadata": metadata,
                "images_count": len(images)
            })
        
        finally:
            # Cleanup temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001, debug=False)
