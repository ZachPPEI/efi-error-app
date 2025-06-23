import csv
import os
import requests
import time
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
ZOHO_CLIENT_ID = os.getenv("ZOHO_CLIENT_ID")
ZOHO_CLIENT_SECRET = os.getenv("ZOHO_CLIENT_SECRET")
ZOHO_REFRESH_TOKEN = os.getenv("ZOHO_REFRESH_TOKEN")

# Validate environment variables
if not all([ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN]):
    logger.error("Missing ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, or ZOHO_REFRESH_TOKEN in .env")
    exit(1)

# Zoho Desk API endpoints
TOKEN_URL = "https://accounts.zoho.com/oauth/v2/token"
TICKETS_URL = "https://desk.zoho.com/api/v1/tickets"

# List of ticket numbers to fetch (66 unique tickets)
TICKET_NUMBERS = list(set([
    "N15317", "152391", "144755", "144249", "155903", "155710", "154949", "155480",
    "155905", "155894", "155653", "148899", "150164", "141049", "140916", "150372",
    "149316", "145040", "143243", "152249", "151624", "152576", "140867", "138644",
    "141095", "140961", "140976", "127812", "137938", "138026", "137696", "137146",
    "138113", "133157", "138364", "137650", "116581", "2250", "54227", "73249",
    "104093", "87466", "106375", "114110", "115777", "116089", "116060", "116240",
    "116239", "116253", "116246", "115627", "116268", "116194", "116266", "157277",
    "152620", "116285", "116288", "116291", "116301", "116305", "116310", "116317",
    "116321", "116320", "116369", "116368", "116299"
]))

def get_access_token():
    """Obtain access token using refresh token."""
    payload = {
        "refresh_token": ZOHO_REFRESH_TOKEN,
        "client_id": ZOHO_CLIENT_ID,
        "client_secret": ZOHO_CLIENT_SECRET,
        "grant_type": "refresh_token"
    }
    try:
        response = requests.post(TOKEN_URL, data=payload, timeout=10)
        if response.status_code != 200:
            logger.error(f"Authentication error: {response.status_code} - {response.text}")
            return None
        return response.json().get("access_token")
    except requests.RequestException as e:
        logger.error(f"Error obtaining access token: {e}")
        return None

def fetch_ticket_by_number(access_token, ticket_number):
    """Fetch a ticket by ticket number using the search endpoint."""
    normalized_ticket_number = ticket_number.lstrip("N#")
    url = f"{TICKETS_URL}/search"
    headers = {
        "Authorization": f"Zoho-oauthtoken {access_token}",
        "Content-Type": "application/json"
    }
    params = {
        "ticketNumber": normalized_ticket_number
    }
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        logger.info(f"Fetching ticket {ticket_number} (normalized: {normalized_ticket_number}) - Status: {response.status_code}")
        if response.status_code != 200:
            logger.error(f"Error fetching ticket {ticket_number}: {response.status_code} - {response.text}")
            return None
        data = response.json()
        tickets = data.get("data", [])
        if not tickets:
            logger.warning(f"No ticket found with ticket number {ticket_number}")
            return None
        ticket = tickets[0]
        return {
            "Ticket ID": ticket.get("id", ""),
            "Subject": ticket.get("subject", ""),
            "Description": ticket.get("description", "") or "No description provided",
            "Resolution": ticket.get("resolution", "") or "No resolution provided"
        }
    except requests.RequestException as e:
        logger.error(f"Error fetching ticket {ticket_number}: {e}")
        return None

def fetch_tickets_to_csv(output_file="tickets.csv"):
    """Fetch specified tickets by ticket number and save to CSV with incremental updates."""
    access_token = get_access_token()
    if not access_token:
        logger.error("Failed to obtain access token. Check .env credentials or regenerate refresh token.")
        return False

    fieldnames = ["Ticket ID", "Subject", "Description", "Resolution"]
    existing_tickets = {}
    try:
        with open(output_file, "r", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                existing_tickets[row["Ticket ID"]] = row
    except FileNotFoundError:
        logger.info("No existing tickets.csv found; creating new file")
    except Exception as e:
        logger.error(f"Error reading existing tickets.csv: {e}")

    ticket_data = []
    total_fetched = 0
    total_successful = 0

    for ticket_number in TICKET_NUMBERS:
        ticket = fetch_ticket_by_number(access_token, ticket_number)
        if ticket and ticket["Ticket ID"] not in existing_tickets:
            ticket_data.append(ticket)
            total_successful += 1
            logger.info(f"Successfully fetched ticket {ticket_number} (Ticket ID: {ticket['Ticket ID']})")
        elif ticket and ticket["Ticket ID"] in existing_tickets:
            logger.info(f"Ticket {ticket_number} (Ticket ID: {ticket['Ticket ID']}) already exists; skipping")
        else:
            logger.warning(f"Failed to fetch ticket {ticket_number}")
        total_fetched += 1
        time.sleep(0.5)  # Reduced delay for efficiency

    logger.info(f"Total tickets attempted: {total_fetched}")
    logger.info(f"Total tickets successfully fetched: {total_successful}")

    if not ticket_data:
        logger.info("No new tickets to append")
        return True

    try:
        with open(output_file, "a", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            if not existing_tickets:
                writer.writeheader()
            writer.writerows(ticket_data)
        logger.info(f"Appended {len(ticket_data)} tickets to {output_file}")
        return True
    except Exception as e:
        logger.error(f"Error appending to {output_file}: {e}")
        return False

if __name__ == "__main__":
    output_path = os.getenv("TICKETS_CSV_PATH", "tickets.csv")
    fetch_tickets_to_csv(output_file=output_path)