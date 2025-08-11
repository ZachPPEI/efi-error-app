from flask import Flask, request, jsonify, send_from_directory, render_template, session
import os
import json
import logging
import pickle
import re
import threading
import datetime
import string
from dotenv import load_dotenv
from urllib.parse import unquote
from jinja2.exceptions import TemplateNotFound
import csv
import warnings
# Suppress fuzzywuzzy warning if python-Levenshtein is not installed
warnings.filterwarnings("ignore", category=UserWarning, module="fuzzywuzzy.fuzz")
app = Flask(__name__)
load_dotenv()
app.secret_key = os.getenv('FLASK_SECRET_KEY', os.urandom(24).hex())
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# Valid files list
VALID_FILES = {
    '2001 – 2010 Duramax EFILive V3 AutoCal ECM Flash Install Instructions.pdf',
    'TCM Stock File Instructions - 01-10.pdf',
    'Aisin Transmission Tuning Install Instructions - EFILive.pdf',
    'EFILive Autocal V3 Datalogging.pdf',
    'Autocal Flashing Procedure.docx',
    'PPEI_BBX.bbx',
    'program autocal step by step.pdf',
    'Reconfig and Tune Loading Short Instructions.docx',
    'L5P PIDS.Channels.xml',
    'lml channels hpt.Channels.xml',
    '2019-2022 Ram 2500-5500 6.7L Cummins_DMRs_General_Derates_SOTF Slot.Channels.xml',
    'early 5.9 channels.Channels.xml',
    'Early6.7Channels1.Channels.xml',
    '6.7 ford channels2.Channels.Channels (1).xml',
    'T87A-T93-Installation-Steps.pdf',
    'MPVI3 Read and Infolog Instructions_Rev_1.pdf',
    'HP Tuners SOTF Instructions.pdf',
    'HPTuners_CUMMINS_SOTF_UserGuide_2022v1.7.pdf',
    '22+ RAM Read File Infolog.pdf',
    'lb7 and lly\'s.docx',
    '18-21 Cummins Bypass Install Instructions.pdf',
    'HPTuners Datalogging Instructions.pdf',
    'https://youtu.be/1s3yqm-zAgw?si=QlFq8De5Npggs31o',
    'Dynojet PV_INFO Instructions.pdf',
    'Installation Guide - Power Vision 3 for Can-Am X3.pdf',
    'Installation Guide - Power Vision 3 for Polaris.pdf',
    'Installation Guide - Power Vision 3 for Honda Talon.pdf',
    'honda_talon_stock_DYNO.png',
    'talon_exhaust_graph.png',
    'talon_alt_fuel_graph.jpeg',
    'talon_CAI_exhaust_graph.jpeg',
    'Talon_turbo_graph.png',
    '2017_canam_graph.webp',
    '18-21_canam_graph.webp',
    '21+canam_graph.webp',
    'Polaris_200_graph.jpg',
    'HPTuners Installing Calibration Instructions_Rev_1.pdf'
}
# Load error code JSONs
try:
    with open('error_codesV1.json', 'r', encoding='utf-8') as f:
        error_codes = json.load(f)
    with open('mean_error_codes.json', 'r', encoding='utf-8') as f:
        mean_error_codes = json.load(f)
    logger.info("Loaded both JSONs successfully")
    logger.info(f"Files for $0333 (normal): {error_codes.get('$0333', {}).get('files', 'Not found')}")
    logger.info(f"Files for $0333 (mean): {mean_error_codes.get('$0333', {}).get('files', 'Not found')}")
except (json.JSONDecodeError, FileNotFoundError) as e:
    logger.error(f"JSON Error: {e}")
    error_codes = {}
    mean_error_codes = {}
# Load tickets
ticket_data = []
try:
    with open('tickets.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        ticket_data = [row for row in reader]
    unique_ticket_ids = set(ticket['Ticket ID'] for ticket in ticket_data)
    logger.info(f"Loaded {len(ticket_data)} tickets from tickets.csv ({len(unique_ticket_ids)} unique Ticket IDs)")
    if len(ticket_data) > len(unique_ticket_ids):
        logger.warning(f"Found {len(ticket_data) - len(unique_ticket_ids)} duplicate Ticket IDs")
except (FileNotFoundError, Exception) as e:
    logger.error(f"Error loading tickets.csv: {e}")
    ticket_data = []
# Populate VALID_FILES from error code JSONs
for codes in [error_codes, mean_error_codes]:
    for code_data in codes.values():
        for file in code_data.get('files', []):
            VALID_FILES.add(file)
logger.info(f"Valid files: {VALID_FILES}")
COUNTER_FILE = 'email_counter.pkl'
def load_counter():
    try:
        with open(COUNTER_FILE, 'rb') as f:
            return pickle.load(f)
    except (FileNotFoundError, pickle.PickleError):
        return 0
def save_counter(counter):
    try:
        with open(COUNTER_FILE, 'wb') as f:
            pickle.dump(counter, f)
    except Exception as e:
        logger.error(f"Failed to save counter: {str(e)}")
def validate_error_code(code):
    pattern = r'^\$?[0-9A-Fa-f]{4}$'
    return bool(re.match(pattern, code.upper()))
def validate_license_number(license):
    pattern = r'^[A-Za-z0-9]{1,12}$'
    return bool(re.match(pattern, license))
log_lock = threading.Lock()
def normalize_text(text):
    """Normalize text by lowercasing and removing punctuation."""
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    return text
def save_chat_log(query, response, pdf_path, source, unanswered):
    log_entry = {
        'timestamp': datetime.datetime.now().isoformat(),
        'session_id': session.get('session_id', 'anonymous'),
        'query': query,
        'response': response,
        'pdf_path': pdf_path,
        'source': source,
        'unanswered': unanswered
    }
    log_file = 'chat_logs.json'
    try:
        with log_lock:
            try:
                with open(log_file, 'r', encoding='utf-8') as f:
                    logs = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                logs = []
            logs.append(log_entry)
            with open(log_file, 'w', encoding='utf-8') as f:
                json.dump(logs, f, indent=2)
        logger.info(f"Saved chat log for query: {query}")
    except Exception as e:
        logger.error(f"Failed to save chat log: {str(e)}")
    if unanswered:
        unanswered_file = 'unanswered_queries.json'
        try:
            with log_lock:
                try:
                    with open(unanswered_file, 'r', encoding='utf-8') as f:
                        unanswered_logs = json.load(f)
                except (FileNotFoundError, json.JSONDecodeError):
                    unanswered_logs = []
                unanswered_logs.append(log_entry)
                with open(unanswered_file, 'w', encoding='utf-8') as f:
                    json.dump(unanswered_logs, f, indent=2)
            logger.info(f"Saved unanswered query: {query}")
        except Exception as e:
            logger.error(f"Failed to save unanswered query: {str(e)}")
@app.errorhandler(Exception)
def handle_exception(e):
    logger.error(f"Unexpected error: {str(e)}", exc_info=True)
    return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500
@app.route('/')
def index():
    try:
        session.pop('asshole_mode_enabled', None)
        session['session_id'] = os.urandom(16).hex()
        logger.info("Serving index page, asshole mode reset")
        return render_template('indexV1.1.html')
    except TemplateNotFound as e:
        logger.error(f"Template not found: {e.name}")
        return jsonify({'error': f"Template {e.name} not found"}), 400
    except Exception as e:
        logger.error(f"Error rendering index: {str(e)}", exc_info=True)
        raise e
@app.route('/favicon.ico')
def favicon():
    favicon_path = os.path.join(app.static_folder, 'favicon.ico')
    if os.path.exists(favicon_path):
        return send_from_directory(app.static_folder, 'favicon.ico')
    return '', 204
@app.route('/submit', methods=['POST'])
def submit():
    try:
        error_code = request.form.get('error_code', '').strip()
        logger.info(f"Received error code: {error_code}")
        if not error_code:
            return jsonify({
                'error_code': '',
                'result': None,
                'message': 'Please enter an error code.',
                'asshole_mode': session.get('asshole_mode_enabled', False)
            }), 400
       
        if error_code.lower() == "fuck you":
            session['asshole_mode_enabled'] = True
            logger.info("Asshole mode enabled for this session")
            return jsonify({
                'error_code': error_code,
                'result': {
                    "description": "Asshole mode activated successfully.",
                    "cause": "You entered the trigger phrase to enable asshole mode.",
                    "action": "Now enter a valid error code to proceed.",
                    "files": [],
                    "asshole_mode": True
                },
                'asshole_mode': True
            })
       
        if error_code.lower() == "sorry":
            session['asshole_mode_enabled'] = False
            logger.info("Asshole mode disabled for this session")
            return jsonify({
                'error_code': error_code,
                'result': {
                    "description": "Asshole mode deactivated.",
                    "cause": "You entered the trigger phrase to disable asshole mode.",
                    "action": "Enter another error code to continue.",
                    "files": [],
                    "asshole_mode": False
                },
                'asshole_mode': False
            })
       
        if not validate_error_code(error_code):
            return jsonify({
                'error_code': error_code,
                'result': None,
                'message': session.get('asshole_mode_enabled', False) and 'Invalid error code format. Use XXXX (numbers or A-F)!' or 'Invalid error code format. Use XXXX (numbers or A-F).',
                'asshole_mode': session.get('asshole_mode_enabled', False)
            }), 400
        asshole_mode_enabled = session.get('asshole_mode_enabled', False)
        code = error_code if error_code.startswith('$') else '$' + error_code.upper()
        source = mean_error_codes if asshole_mode_enabled else error_codes
        result = source.get(code, None)
       
        if result is None:
            logger.warning(f"No data found for error code: {error_code}")
            return jsonify({
                'error_code': error_code,
                'result': None,
                'message': asshole_mode_enabled and f'No data for {error_code}.' or f'No data found for {error_code}.',
                'asshole_mode': asshole_mode_enabled
            }), 404
       
        result = result.copy()
        result["asshole_mode"] = asshole_mode_enabled
       
        return jsonify({
            'error_code': error_code,
            'result': result,
            'asshole_mode': asshole_mode_enabled
        })
    except Exception as e:
        logger.error(f"Error in submit: {str(e)}", exc_info=True)
        raise e
@app.route('/submit_question', methods=['POST'])
def submit_question():
    try:
        data = request.json
        question = data.get('question')
        if not question:
            return jsonify({'success': False, 'message': 'No question provided'}), 400
        log_entry = {
            'timestamp': datetime.datetime.now().isoformat(),
            'session_id': session.get('session_id', 'anonymous'),
            'question': question
        }
        questions_file = 'user_questions.json'
        with log_lock:
            try:
                with open(questions_file, 'r', encoding='utf-8') as f:
                    questions = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                questions = []
            questions.append(log_entry)
            with open(questions_file, 'w', encoding='utf-8') as f:
                json.dump(questions, f, indent=2)
        logger.info(f"Saved question: {question}")
        return jsonify({'success': True, 'message': 'Question submitted successfully'})
    except Exception as e:
        logger.error(f"Error submitting question: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to submit question'}), 500
@app.route('/view_questions')
def view_questions():
    questions_file = 'user_questions.json'
    try:
        with open(questions_file, 'r', encoding='utf-8') as f:
            questions = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        questions = []
    html = '''
    <html>
    <head>
        <title>Logged Questions</title>
        <style>
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <h1>Logged User Questions</h1>
        <table>
            <tr><th>Timestamp</th><th>Session ID</th><th>Question</th></tr>
    '''
    for q in questions:
        html += f"<tr><td>{q['timestamp']}</td><td>{q['session_id']}</td><td>{q['question']}</td></tr>"
    html += '</table></body></html>'
    return html
@app.route('/download/Files/<path:filename>')
def download_file(filename):
    try:
        decoded_filename = unquote(filename)
        logger.info(f"Requested filename: {decoded_filename}")
        if decoded_filename not in VALID_FILES:
            logger.warning(f"Invalid file requested: {decoded_filename}. Valid files: {VALID_FILES}")
            return jsonify({'error': 'Invalid file', 'filename': decoded_filename}), 403
        files_dir = os.path.join(app.static_folder, 'Files')
        files_path = os.path.join(files_dir, decoded_filename)
        logger.info(f"Checking file at: {files_path}")
        if os.path.exists(files_path):
            logger.info(f"File found at: {files_path}")
            return send_from_directory(files_dir, decoded_filename, as_attachment=True)
        else:
            logger.error(f"File not found at: {files_path}")
            return jsonify({'error': 'File not found', 'filename': decoded_filename}), 404
    except Exception as e:
        logger.error(f"Error downloading file {filename}: {str(e)}", exc_info=True)
        raise e
@app.route('/unlink_request', methods=['POST'])
def unlink_request():
    try:
        logger.info("AutoCal link/unlink is disabled, returning default message")
        return jsonify({
            'success': False,
            'message': 'COMING SOON!'
        })
    except Exception as e:
        logger.error(f"Error in unlink_request: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': 'COMING SOON!'
        }), 500
@app.route('/chat', methods=['POST'])
def chat():
    try:
        logger.info("Chatbot is disabled, returning default message")
        return jsonify({
            'response': 'Chatbot coming soon! Stay tuned for updates.',
            'pdf_path': None
        })
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}", exc_info=True)
        return jsonify({
            'response': 'Chatbot coming soon! Stay tuned for updates.',
            'pdf_path': None
        }), 500
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)