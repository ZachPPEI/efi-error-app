import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_manual_responses():
    try:
        with open('unanswered_queries.json', 'r', encoding='utf-8') as f:
            unanswered = json.load(f)
    except FileNotFoundError:
        logger.error("unanswered_queries.json not found")
        return
    except json.JSONDecodeError:
        logger.error("Invalid JSON in unanswered_queries.json")
        return

    training_data = []
    try:
        with open('training_data.json', 'r', encoding='utf-8') as f:
            training_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        pass

    for query_entry in unanswered:
        query = query_entry['query']
        print(f"\nUnanswered Query: {query}")
        response = input("Enter manual response (or press Enter to skip): ")
        if response.strip():
            training_data.append({
                'query': query,
                'response': response,
                'timestamp': query_entry['timestamp']
            })
            logger.info(f"Added manual response for query: {query}")

    try:
        with open('training_data.json', 'w', encoding='utf-8') as f:
            json.dump(training_data, f, indent=2)
        logger.info("Saved training data to training_data.json")
    except Exception as e:
        logger.error(f"Failed to save training data: {str(e)}")

if __name__ == "__main__":
    add_manual_responses()