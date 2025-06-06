from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import traceback
import logging

logging.basicConfig(level=logging.INFO)


app = Flask(__name__)
CORS(app)  # Allows requests from all origins (React frontend)

# MongoDB connection (replace with your actual credentials)
client = MongoClient("mongodb+srv://mariamma:0dkg0bIoBxIlDIww@cluster0.yw4vtrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client.users
logging.info(db)
collection = db.customers

@app.route('/submit', methods=['POST'])
def submit_data():
    try:
        data = request.get_json(force=True)

        result = collection.insert_one(data)
        

        return jsonify({"status": "success", "inserted_id": str(result.inserted_id)}), 200

    except Exception as e:
        
        traceback.print_exc()  # prints full error traceback to logs
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/')
def home():
    return "Flask app is running"

if __name__ == '__main__':
    app.run()
