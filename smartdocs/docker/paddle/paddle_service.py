#!/usr/bin/env python3
"""
PaddleOCR Microservice
Runs on port 8002, accepts PDF/image upload, returns text
"""
from flask import Flask, request, jsonify
from paddleocr import PaddleOCR
import tempfile
import os

app = Flask(__name__)

# Initialize PaddleOCR (load once at startup)
print("Loading PaddleOCR models...")
ocr = PaddleOCR(use_angle_cls=True, lang='en')
print("PaddleOCR ready!")


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "paddleocr"})


@app.route('/ocr', methods=['POST'])
def ocr_image():
    """
    POST /ocr
    Body: multipart/form-data with 'file' field (PDF/image)
    Returns: JSON with OCR text
    """
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name
        
        try:
            # Run OCR (without cls parameter)
            result = ocr.ocr(tmp_path)
            
            # Extract text from result
            text_lines = []
            for page_result in result:
                if page_result:
                    for line in page_result:
                        text_lines.append(line[1][0])
            
            full_text = '\n'.join(text_lines)
            
            return jsonify({
                "success": True,
                "text": full_text,
                "lines_count": len(text_lines)
            })
        
        finally:
            # Cleanup temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8002, debug=False)
