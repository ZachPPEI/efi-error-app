from flask import Flask, request, jsonify, send_from_directory, render_template
import os
import json
import logging

app = Flask(__name__)

# Load error codes with UTF-8 encoding and error handling
try:
    with open('error_codesV1.json', 'r', encoding='utf-8') as f:
        error_codes = json.load(f)
    print("Loaded error_codesV1.json successfully")
    print(f"Files for $0333: {error_codes.get('$0333', {}).get('files', 'Not found')}")
except json.JSONDecodeError as e:
    print(f"JSON Error: {e}")
    error_codes = {}
except FileNotFoundError:
    print("Error: error_codesV1.json not found")
    error_codes = {}

# Rest of your Flask app (routes remain unchanged)
@app.route('/')
def index():
    return render_template('indexV1.1.html')

@app.route('/submit', methods=['POST'])
def submit():
    error_code = request.form.get('error_code', '').strip().upper()
    if not error_code:
        return jsonify({'error_code': '', 'result': None, 'message': 'Please enter an error code'}), 400
    code = error_code if error_code.startswith('$') else '$' + error_code
    result = error_codes.get(code, None)
    if result is None:
        return jsonify({'error_code': error_code, 'result': None, 'message': f'No data found for error code {error_code}'}), 404
    return jsonify({
        'error_code': error_code,
        'result': result
    })

@app.route('/download/Files/<path:filename>')
def download_file(filename):
    try:
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)

        logger.info(f"Requested filename (raw): {filename}")
        from urllib.parse import unquote
        decoded_filename = unquote(filename)
        logger.info(f"Decoded filename: {decoded_filename}")
        static_path = app.static_folder
        files_dir = os.path.join(static_path, 'Files')
        files_path = os.path.join(files_dir, decoded_filename)
        logger.info(f"Checking file at: {files_path}")
        dir_contents = os.listdir(files_dir)
        logger.info(f"Directory contents of static/Files/: {dir_contents}")
        if os.path.exists(files_path):
            logger.info(f"File found at: {files_path}")
            return send_from_directory(files_dir, decoded_filename, as_attachment=True)
        else:
            logger.info(f"File not found at: {files_path}")
            return jsonify({'error': 'File not found', 'filename': decoded_filename}), 404
    except FileNotFoundError:
        logger.info(f"FileNotFoundError for: {filename}")
        return jsonify({'error': 'File not found', 'filename': filename}), 404
    except Exception as e:
        logger.info(f"Error downloading file {filename}: {str(e)}")
        return jsonify({'error': f"Error downloading file: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)