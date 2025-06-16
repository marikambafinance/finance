from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient,ReturnDocument
import traceback
from  datetime import datetime ,timedelta
import random
import string
import pytz
import os
import json
from bson import ObjectId
from zoneinfo import ZoneInfo
from twilio.rest import Client
import time
import pymongo

app = Flask(__name__)
CORS(app)  # Allows requests from all origins (React frontend)
  # Twilio's sandbox number (or your purchased number)
# MongoDB connection (replace with your actual credentials)

#mongo_uri=os.getenv("MONGO_URI")
client = MongoClient("mongodb+srv://mariamma:0dkg0bIoBxIlDIww@cluster0.yw4vtrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
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


def is_duplicate_customer(hpNumber,aadhaarOrPan,  email=None, phone=None):
    reasons = []
    # Build the query to match existing customers with same details
    if collection.find_one({"aadhaarOrPan": aadhaarOrPan}):
        reasons.append("aadhaarOrPan already exists")
    # Optionally add more fields to check for better accuracy 
    if email and collection.find_one({"email": email}):
        reasons.append("email already exists")

    if phone and collection.find_one({"phoneNumber": phone}):
        reasons.append("phoneNumber already exists")

    if hpNumber and collection.find_one({"hpNumber": hpNumber}):
        reasons.append("hpNumber already exists")

    if reasons:
        return True, ", ".join(reasons)
    return False, None


def generate_loan_id(customer_id):
    loans =db.loans
    while True:
        rand_int1 = str(random.randint(10**3, 10**4 - 1))
        rand_int2 = str(random.randint(10**2, 10**3 - 1))
        loan_id = f"LN{rand_int1}{customer_id[:3]}{rand_int2}"
        if not loans.find_one({"loanId":loan_id}):
            return loan_id
        
def create_repayment_schedule(loan_id, customer_id, months,emi):
    start_date = datetime.now(ZoneInfo("Asia/Kolkata"))
    try:
        for i in range(int(months)):
            due_date = start_date + timedelta(days=30 * (i + 1))  # Approx 1 month intervals
            print(i)
            entry = {
                "loanId": loan_id,
                "hpNumber": customer_id,
                "installmentNumber": i + 1,
                "dueDate": due_date,
                "amountDue": emi,
                "amountPaid": 0,
                "status": "pending",
                "paymentDate": None,
                "paymentId":None,
                "paymentMode":None,
                "penalty":0,
                "totalAmountDue":emi,
                "updatedOn":None
                        }
            result = db.repayments.insert_one(entry)
            print(result)
    except Exception as e:
        return {"status":"error","message":str(e)}
    


def insert_customer(customer_data):
    is_duplicate, reason = is_duplicate_customer(
        customer_data.get("hpNumber"),
        customer_data.get("aadhaarOrPan"),
        customer_data.get("email"),
        customer_data.get("phoneNumber"),
    )
    if is_duplicate:
        return jsonify({"status": "error", "message": f"Duplicate found: {reason}"}), 409
    else:
        unique_number = generate_secure_id(customer_data["firstName"],customer_data["lastName"])
        customer_data["hpNumber"]= unique_number
        customer_data["InsertedOn"]= datetime.now(ZoneInfo("Asia/Kolkata"))
        result = collection.insert_one(customer_data)
        customer_data.pop("_id",None)
        return {"insert_id": str(result.inserted_id),"data":customer_data}

def total_loan_payable(loanId):
    pipeline = [
                {"$match": {"loanId": loanId}},  # Filter by loanId
                {"$group": {
                    "_id": "$loanId",
                    "total_payable": {"$sum": { "$toDouble": "$totalAmountDue" }}
                }}
            ]
    result = list(db.repayments.aggregate(pipeline))
    old_total = float(db.loans.find_one({"loanId":loanId},{"totalPayable":1})["totalPayable"])
    new_total = round(float(result[0]["total_payable"]),1)
    print(new_total,old_total)
    if new_total>old_total:
        db.loans.update_one({"loanId":loanId},{"$set":{"totalPayable":str(new_total)}})
        return str(new_total)
    else:
        return str(old_total)   


def insert_loan_data(loan_data):
    #print(loan_data)
    if "hpNumber" in loan_data.keys():
        loan_data["loanId"] = generate_loan_id(loan_data.get("hpNumber"))
        result = db.loans.insert_one(loan_data)
        loan_data.pop("_id",None)
        return {"data":loan_data}
    else:
        return {"error":"hpNumber was not sent"}
    

def generate_unique_payment_id():
    # Get last 8 digits of current milliseconds
    ts_part = str(int(time.time() * 1000))[-8:]
    # Add 3 random digits
    rand_part = str(random.randint(100, 999))
    return ts_part + rand_part


def serialize_doc(doc):
    doc["_id"] = str(doc["_id"])
    return doc



@app.route('/submit', methods=['POST'])
def submit_data():
    try:
        data = request.get_json(force=True)
        res = insert_customer(data)
        #print(result)
        if "error" in res:
            return jsonify({"status": "error", "message": res["error"]}), 400

        return jsonify({"status": "success", "response":res["data"]}), 200

    except Exception as e:
        
        traceback.print_exc()  # prints full error traceback to logs
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/customers", methods=["GET"])
def get_all_customers():
    customers = list(collection.find())
    serialized_customers = [serialize_doc(doc) for doc in customers]
    return jsonify({"customers_data":serialized_customers,"status":"success"}),200

@app.route("/loan", methods=["POST"])
def submit_loan():
    try:
        data = request.get_json(force=True)
        res = insert_loan_data(data)
        
        #print(result)
        if "error" in res:
            return jsonify({"status": "error", "message": res["error"]}), 400
        res = res.get("data")
        #print(res)
        create_repayment_schedule(res["loanId"], res["hpNumber"], res["loanTerm"],res["monthlyEMI"])
        return jsonify({"status": "success", "response":res,"addInfo":"Repayment DB updated"}), 200

    except Exception as e:
        
        traceback.print_exc()  # prints full error traceback to logs
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/get_customer_loan_info', methods=['POST'])
def get_customer_loans():
    data = request.get_json(force=True)
    

    if not "hpNumber" in data.keys():
        return jsonify({"error": "customer_id is required"}), 400
    customer_id = data.get("hpNumber")
    pipeline = [
        { "$match": { "hpNumber": customer_id } },
        {
            "$lookup": {
                "from": "loans",
                "localField": "hpNumber",
                "foreignField": "hpNumber",  # or "_id" if customer ID is MongoDB ObjectId
                "as": "loanInfo"
            }
        },
    ]
    def convert_objectids(doc):
        if isinstance(doc, list):
            return [convert_objectids(d) for d in doc]
        elif isinstance(doc, dict):
            return {k: convert_objectids(v) for k, v in doc.items()}
        elif isinstance(doc, ObjectId):
            return str(doc)
        return doc



    result = list(db.customers.aggregate(pipeline))
    return jsonify({"status":"Success","response":convert_objectids(result)})
    

@app.route('/get_customer_repayment_info', methods=['POST'])
def get_repayment_info():
    data = request.get_json(force=True)
    

    if not "loanId" in data.keys():
        return jsonify({"error": "loan_id is required"}), 400
    loan_id = data.get("loanId")
    try:
        results = db.repayments.find({"loanId": loan_id})
        serialized_repayments = [serialize_doc(doc) for doc in results]
        return jsonify({"repayment_data":serialized_repayments,"status":"success"}),200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/get_customer_loans', methods=['POST'])
def get_loans_with_repayments():
    try:
        data = request.get_json(force=True)
        hp_number = data.get("hpNumber")

        if not hp_number:
            return jsonify({"error": "hpNumber is required"}), 400
        def serialize(doc):
            doc["_id"] = str(doc["_id"])
            return doc
        loans = list(db.loans.find({"hpNumber": hp_number}))
        customer_details = collection.find_one({"hpNumber": hp_number},{"firstName":1,"lastName":1,"phone":1,"_id":0})
        #customer_seralized = serialize(customer_details)
        # Serialize ObjectId and add repayments to each loan
        

        result = []
        for loan in loans:
            loan_serialized = serialize(loan)
            total =total_loan_payable(loan["loanId"])
            loan_serialized["totalPayable"]=total
            result.append(loan_serialized)

        return jsonify({
            "status": "success",
            "data": result,
            "customerDetails":customer_details
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route("/update_repayment",methods=["POST"])
def update_repayment():
    data = request.get_json(force=True)
    required_keys ={"amountPaid", "status","paymentMode","recoveryAgent","totalAmountDue","loanId","installmentNumber"}
    try:
        if required_keys.issubset(data):
            result = db.repayments.update_one( {
                                                "loanId": data.get("loanId").strip(),
                                                "installmentNumber": int(data.get("installmentNumber"))
                                            },
                                            {
                                                "$set": {
                                                    "amountPaid": data.get("amountPaid"),
                                                    "status": data.get("status"),
                                                    "paymentDate": datetime.now(ZoneInfo("Asia/Kolkata")),
                                                    "paymentId": generate_unique_payment_id(),
                                                    "paymentMode": data.get("paymentMode"),
                                                    "recoveryAgent": data.get("recoveryAgent"),
                                                    "totalAmountDue": data.get("totalAmountDue")
                                                }
                                            }
                                        )
            if result.matched_count == 0:
                return jsonify({"status":"error","message":"No document matched the query. Check loanId or installmentNumber."}),400
            elif result.modified_count == 0:
                return jsonify({"status":"error","message":"Document matched but no fields were updated (values may be the same)."}),400
            else:
                return jsonify({"status":"success","message":"Repayment DB updated successfully"}),200

        else:   
            missing = required_keys - data.keys()
            return jsonify({"status":"error","message":f"The following keys are missing: {missing}"}),404

        
    except Exception as e:
        return jsonify({"status":"error","message":str(e)}),500
    
@app.route("/")
def home():
    return jsonify({"message": "API is running"})

if __name__ == '__main__':
    app.run()
