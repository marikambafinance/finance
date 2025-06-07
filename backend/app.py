from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import traceback
from  datetime import datetime
import random
import string
import pytz
import os

app = Flask(__name__)
CORS(app)  # Allows requests from all origins (React frontend)

# MongoDB connection (replace with your actual credentials)
mongo_uri=os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client.users
collection = db.customers

BASE62_ALPHABET = string.digits + string.ascii_uppercase

def int_to_base62(num):
    if num == 0:
        return BASE62_ALPHABET[0]
    base62 = []
    while num:
        num, rem = divmod(num, 36)
        base62.append(BASE62_ALPHABET[rem])
    return ''.join(reversed(base62))

def generate_secure_id(firstName, lastName,random_length=3):
    # Take first letters uppercase
    initials = (firstName[0] + lastName[0]).upper()
    
    # Get timestamp as YYMMDDHHMM
    dt_str = datetime.now().strftime("%y%m%d%H%M")
    dt_num = int(dt_str)
    
    # Encode timestamp to base62
    encoded_dt = int_to_base62(dt_num)
    
    # Add random suffix for collision safety
    suffix = ''.join(random.choices(BASE62_ALPHABET, k=random_length))
    
    # Combine all parts
    return f"{initials}{encoded_dt}{suffix}"


def is_duplicate_customer(firstName,aadhaarOrPan, lastName=None, email=None, phone=None):
    # Build the query to match existing customers with same details
    query = {
        "firstName": firstName,
        "aadhaarOrPan":aadhaarOrPan
    }
    # Optionally add more fields to check for better accuracy
    if lastName:
        query["lastName"] = lastName

    if email:
        query["email"] = email
    if phone:
        query["phoneNumber"] = phone

    return collection.find_one(query) is not None


def get_ist():
    ist = pytz.timezone('Asia/Kolkata')
    return datetime.now(ist)

def insert_customer(customer_data):
    if is_duplicate_customer(
        customer_data.get("firstName"),
        customer_data.get("aadhaarOrPan"),
        customer_data.get("lastName"),
        customer_data.get("email"),
        customer_data.get("phoneNumber"),
    ):
        return {"error": "Duplicate customer found!"}
    else:
        unique_number = generate_secure_id(customer_data["firstName"],customer_data["lastName"])
        customer_data["CustomerID"]= unique_number
        customer_data["InsertedOn"]= get_ist()
        result = collection.insert_one(customer_data)
        return {"insert_id":result.inserted_id,"data":customer_data}

@app.route('/submit', methods=['POST'])
def submit_data():
    try:
        data = request.get_json(force=True)
        res = insert_customer(data)
        #print(result)
        if "error" in res:
            return jsonify({"status": "error", "message": res["error"]}), 400

        return jsonify({"status": "success", "response":res}), 200

    except Exception as e:
        
        traceback.print_exc()  # prints full error traceback to logs
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route("/")
def home():
    return jsonify({"message": "API is running"})

if __name__ == '__main__':
    app.run()
