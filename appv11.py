from flask import Flask, request, jsonify, send_from_directory, render_template, session
import os
import json
import logging

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Required for session management

# Load both error code JSONs
try:
    with open('error_codesV1.json', 'r', encoding='utf-8') as f:
        error_codes = json.load(f)
    with open('mean_error_codes.json', 'r', encoding='utf-8') as f:
        mean_error_codes = json.load(f)
    print("Loaded both JSONs successfully")
    print(f"Files for $0333 (normal): {error_codes.get('$0333', {}).get('files', 'Not found')}")
    print(f"Files for $0333 (mean): {mean_error_codes.get('$0333', {}).get('files', 'Not found')}")
except json.JSONDecodeError as e:
    print(f"JSON Error: {e}")
    error_codes = {}
    mean_error_codes = {}
except FileNotFoundError as e:
    print(f"File Error: {e}")
    error_codes = {}
    mean_error_codes = {}

@app.route('/')
def index():
    # Reset asshole mode on page load/refresh by clearing the session
    session.pop('asshole_mode_enabled', None)
    return render_template('indexV1.1.html')

@app.route('/submit', methods=['POST'])
def submit():
    error_code = request.form.get('error_code', '').strip().upper()
    if not error_code:
        return jsonify({
            'error_code': '',
            'result': None,
            'message': 'Please enter an error code, dumbass',
            'asshole_mode': session.get('asshole_mode_enabled', False)
        }), 400
    
    # Check if "fuck you" is entered to enable asshole mode
    if error_code.lower() == "fuck you":
        session['asshole_mode_enabled'] = True
        print("Asshole mode enabled for this session")
        return jsonify({
            'error_code': error_code,
            'result': {
                "description": "Well, fuck me—you’ve activated asshole mode, you prick.",
                "cause": "You typed the magic words, dumbass.",
                "action": "Now search a real code, or get lost.",
                "files": [],
                "asshole_mode": True
            },
            'asshole_mode': True
        })
    
    # Check if "sorry" is entered to disable asshole mode
    if error_code.lower() == "sorry":
        session['asshole_mode_enabled'] = False
        print("Asshole mode disabled for this session")
        return jsonify({
            'error_code': error_code,
            'result': {
                "description": "Fine, I’ll stop being an asshole—for now.",
                "cause": "You said the magic word to turn off asshole mode.",
                "action": "Search another code, but don’t expect me to be nice forever.",
                "files": [],
                "asshole_mode": False
            },
            'asshole_mode': False
        })
    
    # Use session to determine asshole mode state
    asshole_mode_enabled = session.get('asshole_mode_enabled', False)
    
    code = error_code if error_code.startswith('$') else '$' + error_code
    source = mean_error_codes if asshole_mode_enabled else error_codes
    result = source.get(code, None)
    
    if result is None:
        return jsonify({
            'error_code': error_code,
            'result': None,
            'message': f'No data for {error_code}, you clueless bastard',
            'asshole_mode': asshole_mode_enabled
        }), 404
    
    result = result.copy()
    result["asshole_mode"] = asshole_mode_enabled
    
    return jsonify({
        'error_code': error_code,
        'result': result,
        'asshole_mode': asshole_mode_enabled
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