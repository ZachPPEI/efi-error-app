from flask import Flask, render_template, request, send_from_directory, jsonify
import json
import os

app = Flask(__name__)

# Load error codes from JSON file
try:
    json_path = os.path.join(os.path.dirname(__file__), 'error_codesV1.json')  # Updated to error_codesV1.json
    with open(json_path, 'r', encoding='utf-8') as f:
        error_codes = json.load(f)
    print(f"Successfully loaded {len(error_codes)} error codes from 'error_codesV1.json'.")
except FileNotFoundError:
    print("Error: 'error_codesV1.json' not found. Please ensure the file is in the same directory as appV1.1.py.")
    error_codes = {}
except json.JSONDecodeError as e:
    print(f"Error: Invalid JSON in 'error_codesV1.json': {e}")
    error_codes = {}

@app.route('/', methods=['GET'])
def index():
    return render_template('indexV1.1.html', error_codes=error_codes)

@app.route('/submit', methods=['POST'])
def submit():
    error_code = request.form.get('error_code', '').strip().upper()
    if not error_code:
        return jsonify({'error_code': '', 'result': None, 'message': 'Please enter an error code'}), 400
    code = error_code if error_code.startswith('$') else '$' + error_code
    result = error_codes.get(code, None)
    return jsonify({
        'error_code': error_code,
        'result': result
    })

@app.route('/download/Files/<path:filename>')
def download_file(filename):
    try:
        # Log the raw filename from the URL
        print(f"Raw filename from URL: {filename}")
        # Resolve the full file path
        static_path = app.static_folder
        files_path = os.path.join(static_path, 'Files', filename)
        print(f"Checking file at: {files_path}")  # Debug log
        # List directory contents for debugging
        dir_contents = os.listdir(os.path.join(static_path, 'Files'))
        print(f"Directory contents of static/Files/: {dir_contents}")
        if os.path.exists(files_path):
            print(f"File found at: {files_path}")  # Debug log
            return send_from_directory(os.path.join(static_path, 'Files'), filename, as_attachment=True)
        else:
            print(f"File not found at: {files_path}")  # Debug log
            return "File not found", 404
    except FileNotFoundError:
        print(f"File not found error for: {filename}")  # Debug log
        return "File not found", 404
    except Exception as e:
        print(f"Error downloading file {filename}: {str(e)}")  # Debug log
        return f"Error downloading file: {str(e)}", 500

if __name__ == '__main__':
    print("Starting Flask app...")
    app.run(debug=True, host='0.0.0.0', port=5000)