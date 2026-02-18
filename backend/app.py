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
#from twilio.rest import Client
import time
import pymongo
import hashlib
from dateutil.relativedelta import relativedelta
from pymongo import UpdateOne
from  threading import Thread
#from dotenv import load_dotenv
app = Flask(__name__)
CORS(app)  # Allows requests from all origins (React frontend)
  # Twilio's sandbox number (or your purchased number)
# MongoDB connection (replace with your actual credentials)
#load_dotenv() 
mongo_uri=os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client.users
collection = db.customers
EXPECTED_API_KEY =os.getenv("EXPECTED_API_KEY")
BASE62_ALPHABET = string.digits + string.ascii_uppercase


def generate_secure_id(firstName, lastName):
    if not firstName or not lastName:
        raise ValueError("First name and last name must not be empty.")

    year_suffix = str(datetime.now().year)[-2:]
    initials = firstName[0].upper() + lastName[0].upper()
    prefix = f"MF{year_suffix}{initials}"

    # Match any ID from the current year, regardless of initials
    year_prefix = f"MF{year_suffix}"

    last_entry = collection.find_one(
        {"hpNumber": {"$regex": f"^{year_prefix}[A-Z]{{2}}\\d{{5}}$"}},
        sort=[("_id", -1)]
    )

    if last_entry:
        last_seq = int(last_entry["hpNumber"][-5:])
        new_seq = last_seq + 1
    else:
        new_seq = 1

    new_id = f"{prefix}{new_seq:05d}"
    return new_id


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
        
def create_repayment_schedule(loan_id, customer_id, months, emi):
    try:
        # Fetch loan to get loanAmount and interestRate
        loan = db.loans.find_one({"loanId": loan_id})
        if not loan:
            return {"status": "error", "message": f"Loan {loan_id} not found."}

        loan_amount = float(loan.get("loanAmount", 0))
        interest_rate = float(loan.get("interestRate", 0))  # percentage
        tenure = int(months)

        # Calculate flat monthly interest
        monthly_interest = round(((loan_amount)*(interest_rate/100)),2)

        start_date = datetime.now(ZoneInfo("Asia/Kolkata")).replace(hour=0, minute=0, second=0, microsecond=0)
        repayment_entries = []

        for i in range(tenure):
            due_date = start_date + relativedelta(months=i + 1)

            repayment_entries.append({
                "loanId": loan_id,
                "hpNumber": customer_id,
                "installmentNumber": i + 1,
                "dueDate": due_date,
                "amountDue": emi,
                "amountPaid": 0,
                "status": "pending",
                "paymentDate": None,
                "paymentId": None,
                "paymentMode": None,
                "penalty": 0,
                "recoveryAgentAmount":0,
                "totalAmountDue": str(emi),
                "interestAmount": str(monthly_interest),
                "updatedOn": None,
                "remainingPayment":str(emi)
            })

        result = db.repayments.insert_many(repayment_entries)
        return {"status": "success", "insertedCount": len(result.inserted_ids)}

    except Exception as e:
        return {"status": "error", "message": str(e)}
    


# --- In your DB helper function ---
def insert_customer(customer_data):
    is_duplicate, reason = is_duplicate_customer(
        customer_data.get("hpNumber"),
        customer_data.get("aadhaarOrPan"),
        customer_data.get("email"),
        customer_data.get("phoneNumber"),
    )

    if is_duplicate:
        return {"status": "error", "message": f"Duplicate found: {reason}"}

    unique_number = generate_secure_id(customer_data["firstName"], customer_data["lastName"])
    customer_data["hpNumber"] = unique_number
    customer_data["InsertedOn"] = datetime.now(ZoneInfo("Asia/Kolkata"))

    result = collection.insert_one(customer_data)
    customer_data.pop("_id", None)

    return {"status": "success", "insert_id": str(result.inserted_id), "data": customer_data}

def total_loan_payable(hpNumber):
    pipeline = [
    # Match customer by hpNumber
    { "$match": { "hpNumber": hpNumber } },

    # Lookup loans
    {
        "$lookup": {
            "from": "loans",
            "localField": "hpNumber",
            "foreignField": "hpNumber",
            "as": "loanList"
        }
    },

    # Unwind loans (preserving customers with no loans)
    {
        "$unwind": {
            "path": "$loanList",
            "preserveNullAndEmptyArrays": True
        }
    },

    # Lookup repayment stats if loan exists
    {
        "$lookup": {
            "from": "repayments",
            "let": { "loanId": "$loanList.loanId" },
            "pipeline": [
                {
                    "$match": {
                        "$expr": { "$eq": ["$loanId", "$$loanId"] }
                    }
                },
                {
                    "$group": {
                        "_id": "$loanId",
                        "missedCount": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$and": [
                                            { "$ne": ["$status", "paid"] },
                                            { "$lt": ["$dueDate", datetime.now()] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        "latePaymentCount": {
                            "$sum": {
                                "$cond": [
                                    {
                                        "$and": [
                                            { "$eq": ["$status", "paid"] },
                                            { "$gt": ["$paidDate", "$dueDate"] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                         "monthsPaid": {
                                "$sum": {
                                    "$cond": [
                                        { "$eq": ["$status", "paid"] },
                                        1,
                                        0
                                ]
                            }
                        }
                    }
                }
            ],
            "as": "repayment_summary"
        }
    },

    # Merge loan + repayment only if loan exists
    {
        "$addFields": {
            "loanWithStats": {
                "$cond": [
                    { "$ne": ["$loanList", None] },
                    {
                        "$mergeObjects": [
                            "$loanList",
                            {
                                "missedCount": {
                                    "$ifNull": [
                                        { "$arrayElemAt": ["$repayment_summary.missedCount", 0] },
                                        0
                                    ]
                                },
                                "latePaymentCount": {
                                    "$ifNull": [
                                        { "$arrayElemAt": ["$repayment_summary.latePaymentCount", 0] },
                                        0
                                    ]
                                },
                                "monthsPaid": {
                                    "$ifNull": [
                                        { "$arrayElemAt": ["$repayment_summary.monthsPaid", 0] },
                                        0
                                    ]
                                }
                            }
                        ]
                    },
                    None
                ]
            }
        }
    },

    # Group back by customer
    {
        "$group": {
            "_id": "$_id",
            "customerDetails": {
                "$first": {
                    "firstName": "$firstName",
                    "lastName": "$lastName",
                    "phone": "$phone"
                }
            },
            "data": {
                "$push": {
                    "$cond": [
                        { "$ne": ["$loanWithStats", None] },
                        "$loanWithStats",
                        "$$REMOVE"
                    ]
                }
            }
        }
    },

    # Add status
    {
        "$addFields": {
            "status": "success"
        }
    },

    # Final shape
    {
        "$project": {
            "_id": 0,
            "customerDetails": 1,
            "data": 1,
            "status": 1
        }
    }
]
    result = list(db.customers.aggregate(pipeline))[0]
    return result


def get_cust_loans_info(hpNumber):
    pipeline = [
        {"$match": {"hpNumber": hpNumber}},

        # Lookup loans
        {
            "$lookup": {
                "from": "loans",
                "localField": "hpNumber",
                "foreignField": "hpNumber",
                "as": "loans"
            }
        },

        # Lookup repayments and calculate stats
        {
            "$lookup": {
                "from": "repayments",
                "pipeline": [
                    {
                        "$group": {
                            "_id": "$loanId",
                            "totalPaid": {
                                "$sum": {
                                    "$cond": [
                                        {"$eq": ["$status", "paid"]},
                                        {"$toDouble": "$amountPaid"},
                                        0
                                    ]
                                }
                            },
                            # monthsPaid = number of repayments with status = paid
                            "monthsPaid": {
                                "$sum": {"$cond": [{"$eq": ["$status", "paid"]}, 1, 0]}
                            },
                            "latePaymentCount": {
                                "$sum": {
                                    "$cond": [
                                        {
                                            "$and": [
                                                {"$eq": ["$status", "paid"]},
                                                {"$gt": ["$paymentDate", "$dueDate"]}
                                            ]
                                        },
                                        1,
                                        0
                                    ]
                                }
                            },
                            # missedCount = pending + overdue
                            "missedCount": {
                                "$sum": {
                                    "$cond": [
                                        {
                                            "$and": [
                                                {"$eq": ["$status", "pending"]},
                                                {"$lt": ["$dueDate", "$$NOW"]}
                                            ]
                                        },
                                        1,
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ],
                "as": "repayment_totals"
            }
        },

        # Merge repayment stats into each loan
        {
            "$addFields": {
                "loans": {
                    "$map": {
                        "input": "$loans",
                        "as": "loan",
                        "in": {
                            "$mergeObjects": [
                                "$$loan",
                                {
                                    "$ifNull": [
                                        {
                                            "$let": {
                                                "vars": {
                                                    "match": {
                                                        "$first": {
                                                            "$filter": {
                                                                "input": "$repayment_totals",
                                                                "as": "r",
                                                                "cond": {
                                                                    "$eq": ["$$r._id", "$$loan.loanId"]
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                "in": {
                                                    "totalPaid": "$$match.totalPaid",
                                                    "monthsPaid": "$$match.monthsPaid",
                                                    "latePaymentCount": "$$match.latePaymentCount",
                                                    "missedCount": "$$match.missedCount"
                                                }
                                            }
                                        },
                                        {
                                            "totalPaid": 0,
                                            "monthsPaid": 0,
                                            "latePaymentCount": 0,
                                            "missedCount": 0
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                }
            }
        },

        {"$project": {"repayment_totals": 0}}
    ]

    result = list(db.customers.aggregate(pipeline))

    def serialize_object_ids(data):
        if isinstance(data, list):
            return [serialize_object_ids(doc) for doc in data]
        elif isinstance(data, dict):
            for key in list(data.keys()):
                if isinstance(data[key], ObjectId):
                    data[key] = str(data[key])
                elif isinstance(data[key], (dict, list)):
                    data[key] = serialize_object_ids(data[key])
            return data
        return data

    return serialize_object_ids(result)



def insert_loan_data(loan_data):
    #print(loan_data)
    if "hpNumber" in loan_data.keys():
        loan_data["loanId"] = generate_loan_id(loan_data.get("hpNumber"))
        loan_data["status"] = "active"
        loan_data["totalAmountDue"] =loan_data["totalPayable"]
        loan_data["totalPenalty"]="0"
        loan_data["penaltyPaid"]="0"
        loan_data["penaltyBalance"]=loan_data["totalPenalty"]
        #loan_data["initialTotalPay"]=loan_data["totalPayable"]
        loan_data["totalPayWithPenalty"]= float(loan_data["totalPenalty"]) + float(loan_data["totalPayable"])
        loan_amount = float(loan_data.get("loanAmount", 0))
        interest_rate = float(loan_data.get("interestRate", 0))  # percentage
        # Calculate flat monthly interest
        monthly_interest = round(((loan_amount)*(interest_rate/100)),2)
        loan_data["monthlyInterestAmount"] =monthly_interest



        result = db.loans.insert_one(loan_data)
        loan_data.pop("_id",None)
        db.ledger.insert_one({
        "hpNumber": loan_data["hpNumber"],
        "loanId": loan_data["loanId"],
        "paymentId": generate_unique_payment_id(),
        "paymentMode": "cash",
        "amountIssued": loan_data["loanAmount"],
        "actualAmountIssued":loan_data["actualAmount"],
        "paymentDate": datetime.now(),
        "createdOn": datetime.now(),
        "amountPaid":0
         })

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

def close_loan_if_fully_paid(loan_id, installment_number):
    try:
        # Count how many repayment records exist for this loanId
        actual_installments = db.repayments.count_documents({"loanId": loan_id})
        installments = db.repayments.count_documents({"loanId": loan_id,"status":"paid"})

        if actual_installments == int(installments):
            result = db.loans.update_one(
                {"loanId": loan_id, "status": {"$ne": "closed"}},
                {"$set": {"status": "closed"}}
            )
            return {
                "status": "success",
                "message": f"Loan {loan_id} marked as closed." if result.modified_count else "Loan already closed."
            }
        else:
            return {
                "status": "success",
                "message": f"Loan {loan_id} is not complete yet. Only {actual_installments}/{installment_number} installments present."
            }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.before_request
def global_auth_check():
    exempt_routes = ['home','dashboard_stats']
    if request.endpoint in exempt_routes:
        return
    if request.method == "OPTIONS":
        return '', 200
    api_key = request.headers.get('x-api-key')
    if api_key:
        api_key = hashlib.sha256(api_key.encode()).hexdigest()
    if not api_key or api_key != EXPECTED_API_KEY:
        return jsonify({'message': 'Unauthorized'}), 401

@app.route("/search",methods=["POST","OPTIONS"])
def search():
    data = request.get_json(force=True)
    
    if "loanId" in data.keys():
        res = db.loans.find_one({"loanId":data["loanId"]},{"hpNumber":1,"_id":0})
        data={}
        data["hpNumber"]=res["hpNumber"]

    query = {
        key : {"$regex":value,"$options":"i"}
        for key,value in data.items()
        if value
     }
    result = list(collection.find(query,{
        "_id": 0,
        "hpNumber": 1,
        "phone": 1,
        "aadhaarOrPan": 1,
        "annualIncome": 1,
        "firstName": 1,
        "lastName": 1
    }))

    if result:    
        return jsonify({"status":"success","search_reponse":result}),200
    else:
        return jsonify({"status": "no_match", "search_response": "No records found"}), 404

@app.route('/submit', methods=['POST',"OPTIONS"])
def submit_data():
    try:
        data = request.get_json(force=True)
        res = insert_customer(data)

        if res.get("status") == "error":
            return jsonify({"status": "error", "message": res["message"]}), 409

        return jsonify({"status": "success", "response": res["data"]}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500




@app.route("/customers", methods=["GET","OPTIONS"])
def get_all_customers():
    limit = 10
    query = {}
    prev_id = request.args.get("prev_id")
    next_id = request.args.get("next_id")  # for forward paging

    if prev_id:
        query["_id"] = { "$lt": ObjectId(prev_id) }
        cursor = collection.find(query,{
                "_id": 1,
                "hpNumber": 1,
                "phone": 1,
                "aadhaarOrPan": 1,
                "annualIncome": 1,
                "firstName": 1,
                "lastName": 1
            }).sort("_id", -1).limit(limit)
        results = list(cursor)[::-1]  # reverse back to normal order

    elif next_id:
        query["_id"] = { "$gt": ObjectId(next_id) }
        results = list(collection.find(query,{
                    "_id": 1,
                    "hpNumber": 1,
                    "phone": 1,
                    "aadhaarOrPan": 1,
                    "annualIncome": 1,
                    "firstName": 1,
                    "lastName": 1
                }).limit(limit))

    else:
        results = list(collection.find({},{
                    "_id": 1,
                    "hpNumber": 1,
                    "phone": 1,
                    "aadhaarOrPan": 1,
                    "annualIncome": 1,
                    "firstName": 1,
                    "lastName": 1
                }).limit(limit))
    
    has_prev = (
        collection.find_one({"_id": {"$lt": results[0]["_id"]}})
        if results else False
    )

    # Check if next page exists
    has_next = (
        collection.find_one({"_id": {"$gt": results[-1]["_id"]}})
        if results else False
    )

    for res in results:
            res["_id"]=str(res["_id"])

    return jsonify({
        "customers": results,
        "prev_id": str(results[0]["_id"]) if has_prev else None,
        "next_id": str(results[-1]["_id"]) if has_next else None
    }),200

@app.route("/only_customer_and_loans",methods=["POST","OPTIONS"])
def get_all_customers_loans():
    data = request.get_json(force=True)
    if "hpNumber" in data.keys():
        serialized_customers = get_cust_loans_info(data["hpNumber"])
        return jsonify({"customers_data":serialized_customers,"status":"success"}),200
    else:
        return jsonify({"message":"missing hpNumber","status":"error"}),400


@app.route("/loan", methods=["POST","OPTIONS"])
def submit_loan():
    try:
        data = request.get_json(force=True)
        if "hpNumber" in data.keys():
            validation = db.customers.find_one({"hpNumber":data["hpNumber"]})
        
        if validation is None:
            # Customer not found
            return jsonify({"status": "error", "message": "Customer not found"}),404
                
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
    
@app.route('/get_customer_loan_info', methods=['POST',"OPTIONS"])
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
    

@app.route('/get_customer_repayment_info', methods=['POST',"OPTIONS"])
def get_repayment_info():
    data = request.get_json(force=True)
    

    if not "loanId" in data.keys():
        return jsonify({"error": "loan_id is required"}), 400
    loan_id = data.get("loanId")
    try:
        results = list(db.repayments.find({"loanId": loan_id}))
        response = [serialize_doc(doc) for doc in results]
        response.sort(key= lambda x: x["installmentNumber"])
        return jsonify({"repayment_data":response,"status":"success"}),200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/get_customer_loans', methods=['POST',"OPTIONS"])
def get_loans_with_repayments():
    try:
        data = request.get_json(force=True)
        if not "hpNumber" in data.keys():
            return jsonify({"error": "customer_id is required"}), 400
        customer_id = data.get("hpNumber")
        result = total_loan_payable(customer_id)
        def serialize(doc):
            if isinstance(doc, dict):
                for k, v in doc.items():
                    if isinstance(v, ObjectId):
                        doc[k] = str(v)
                    elif isinstance(v, list):
                        doc[k] = [serialize(d) if isinstance(d, dict) else d for d in v]
                    elif isinstance(v, dict):
                        doc[k] = serialize(v)
                return doc
            else:
                return doc 
        result = serialize(result)
        if "loanId" in result["data"][0].keys():
            pass
        else:
            result["data"]=[]

        """
        return jsonify({
            "status": "success",
            "customerDetails": {
                "firstName": result.get("firstName"),
                "lastName": result.get("lastName"),
                "phone": result.get("phone")
            },
            "data": result.get("loans", [])
        })
        """
        return result

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    


def update_next_month_penalty(next_month_penalty, hpNumber, loanid, currentinstallmentNumber):
    loan = db.loans.find_one(
        {"hpNumber": hpNumber, "loanId": loanid},
        {"loanTerm": 1, "_id": 0}
    )

    if not loan:
        print(f"No loan found for hpNumber={hpNumber}, loanId={loanid}")
        return
    
    if currentinstallmentNumber != loan["loanTerm"]:
        repayment = db.repayments.find_one({"hpNumber": hpNumber, "loanId": loanid,"installmentNumber":(currentinstallmentNumber+1)})
        penalty = float(repayment.get("penalty",0))
        amount_due  = float(repayment.get("amountDue",0))
        recoveryAgentAmount = float(repayment.get("recoveryAgentAmount",0))
        new_penalty = recoveryAgentAmount + next_month_penalty  # = 1000
        new_total_penalty = penalty + new_penalty  # = 1000
        new_total_amount_due = amount_due + new_total_penalty 
        db.repayments.update_one(
            {
                "hpNumber": hpNumber,
                "loanId": loanid,
                "installmentNumber": currentinstallmentNumber + 1
            },
            {
                "$set": {
                "previousDues": next_month_penalty,
                "recoveryAgentAmount": new_penalty,
                "totalAmountDue": str(new_total_amount_due),
                "totalPenalty": str(new_total_penalty)
            }
            }
        )

    
@app.route("/update_repayment",methods=["POST","OPTIONS"])
def update_repayment():
    data = request.get_json(force=True)
    required_keys = {
        "amountPaid", "status", "paymentMode", "recoveryAgent",
        "totalAmountDue", "loanId", "installmentNumber","penalty","recoveryAgentAmount","remainingPayment","penaltyPaid"
    }

    missing_keys = required_keys - data.keys()
    if missing_keys:
        return jsonify({
            "status": "error",
            "message": f"The following keys are missing: {', '.join(missing_keys)}"
        }), 400
    
    # Extract and clean inputs
    loan_id = data["loanId"].strip()
    installment_number = int(data["installmentNumber"])
    new_amount_paid = float(data["amountPaid"])
    status = data["status"]
    payment_mode = data["paymentMode"]
    recovery_agent = data["recoveryAgent"]
    total_amount_due = float(data.get("totalAmountDue", 0)) # convert to float if stored as numeric in DB
    penalty = str(data["penalty"])
    recoveryAgentAmount = str(data.get("recoveryAgentAmount",0))    
    remainingPayment =round(float(data["remainingPayment"]),2)    
    payment_id = generate_unique_payment_id()
    payment_date= datetime.now(ZoneInfo("Asia/Kolkata"))
    amount_due = float(data["amountDue"])
    penalty_paid = float(data["penaltyPaid"])
    

    
    if status !="partial":
        if db.repayments.find_one({"loanId":loan_id,"installmentNumber":installment_number},{"status":1,"_id":0})["status"]==status:
            return jsonify({
                "status": "error",
                "message": f"Payment was already made, Unable to update"
            }), 200
    
    if status=="partial":
        if (remainingPayment-round(float(new_amount_paid),2))<0:
            return jsonify({"status":"error","message":"Remaining balance cannot be negative"})
    
    if status=="partial":
        amount_paid = db.repayments.find_one({"loanId":loan_id,"installmentNumber":installment_number},{"amountPaid":1,"_id":0})
        new_amount_paid+= float(amount_paid["amountPaid"])

        if (round(new_amount_paid,2)>=round(total_amount_due,2)or (round(new_amount_paid,2)-round(total_amount_due,2)==0)):
            status="paid"
    try:
        
        result = db.repayments.update_one(
            {"loanId": loan_id, "installmentNumber": installment_number},
            {"$set": {
                "amountPaid": str(new_amount_paid),
                "status": status,
                "paymentDate": payment_date,
                "paymentId": payment_id,
                "paymentMode": payment_mode,
                "recoveryAgent": recovery_agent,
                "totalAmountDue": str(total_amount_due),
                "penalty" : penalty,
                "recoveryAgentAmount":recoveryAgentAmount,
                "remainingPayment":remainingPayment,
            }}
        )
        loan = db.loans.find_one({"loanId":loan_id},{"hpNumber":1,"totalPayWithPenalty":1,"_id":0})

                
        amount_to_update = (
                new_amount_paid
                if status != "partially_paid"
                else new_amount_paid - float(amount_paid["amountPaid"])
            )
        if amount_to_update >0:              
            update_ledger = db.ledger.insert_one({
                "hpNumber":loan["hpNumber"],
                "loanId":loan_id,
                "paymentId":payment_id,
                "paymentMode":payment_mode,
                "amountPaid":new_amount_paid if status!="partial" else new_amount_paid-float(amount_paid["amountPaid"]),
                "paymentDate":payment_date,
                "createdOn":datetime.now()
            })

        loan_res = db.repayments.aggregate(           [
                    { "$match": { "loanId": loan_id } },
                    
                    {
                        "$group": {
            "_id": "$loanId",
            
            "totalPayable": {
                        "$sum": {
                            "$toDouble": { "$ifNull": ["$totalAmountDue", 0] }
                        }
                        },

            "totalPaid": {
                "$sum": {
                     "$toDouble": { "$ifNull": ["$amountPaid", 0] }
                }
            },
            
            "totalPenaltySum": {
                        "$sum": {
                            "$add": [
                                { "$toDouble": { "$ifNull": ["$penalty", 0] } },
                                { "$toDouble": { "$ifNull": ["$recoveryAgentAmount", 0] } }
                            ]
           } 
          }
          
        }
    }
])

        data = next(loan_res, None)
        total_payable = round(float(data["totalPayable"]), 2)
        total_paid = round(data["totalPaid"], 2)
        total_amount_due = total_payable-total_paid
        total_penalty = round(float(data["totalPenaltySum"]),2)
        penalty_balance = total_penalty - penalty_paid
        total_Pay_With_Penalty = total_payable + total_penalty

        update_result = db.loans.update_one(
            {"loanId": loan_id},
            {"$set": {"totalPayable": str(total_payable),"totalPaid":str(total_paid),
                      "totalAmountDue":str(total_amount_due),
                      "totalPenalty": str(total_penalty),
                      "penaltyBalance":str(penalty_balance),
                      "totalPayWithPenalty":str(total_Pay_With_Penalty)
                      }}
        )
        if result.matched_count == 0:
            return jsonify({
                "status": "error",
                "message": "No document matched the query. Check loanId or installmentNumber."
            }), 404

        if result.modified_count == 0:
            return jsonify({
                "status": "warning",
                "message": "Document matched but no fields were updated (values may be the same)."
            }), 200  # not an error, just informational

        # Optional post-update logic
        close_loan_if_fully_paid(loan_id,installment_number)

        return jsonify({
            "status": "success",
            "message": "Repayment DB updated successfully"
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500
    

@app.route("/update_customer",methods=["POST","OPTIONS"])
def update_customer():
    data = request.get_json(force=True)

    # 1. Ensure 'hpNumber' is present
    if "hpNumber" not in data:
        return jsonify({"status": "error", "message": "hpNumber not present"}), 400

    customer_id = data.pop("hpNumber")

    # 2. If no other fields to update
    if not data:
        return jsonify({"status": "success", "message": "No fields to update"}), 200

    # 3. Attempt update
    result = collection.update_one({"hpNumber": customer_id}, {"$set": data})

    if result.matched_count == 0:
        return jsonify({"status": "error", "message": "Customer not found"}), 404

    return jsonify({"status": "success", "message": "Record successfully updated"}), 200

@app.route("/dashboard-stats", methods=["GET","OPTIONS"])
def dashboard_stats():
    try:
        today = datetime.now(ZoneInfo("Asia/Kolkata"))
        first_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Totals and Loan Aggregates
        loan_stats = db.loans.aggregate([
            {
                "$group": {
                    "_id": None,
                    "totalLoans": {"$sum": 1},
                    "activeLoans": {"$sum": {"$cond": [{"$eq": ["$status", "active"]}, 1, 0]}},
                    "closedLoans": {"$sum": {"$cond": [{"$ne": ["$status", "active"]}, 1, 0]}},
                    "amountIssued": {"$sum": {"$toDouble": "$loanAmount"}},
                    
                            "foreClosedInterest": {
                                "$sum": { "$toDouble": { "$ifNull": ["$foreCloseNetInterest", 0] } }
                            },
                            "dashboardPenalty": {
                                "$sum": { "$toDouble": { "$ifNull": ["$penaltyPaid", 0] } }
                            },
                            "totalactualAmountIssued": {
                                "$sum": { "$toDouble": { "$ifNull": ["$actualAmount", 0] } }
                            
                            },
                             "totalPenaltyBalance": {
                                "$sum": { "$toDouble": { "$ifNull": ["$penaltyBalance", 0] } }
                            },
                            "totalAgreementAmount": {
                                "$sum": { "$toDouble": { "$ifNull": ["$agreement", 0] } }
                            },
                        
                                            }
            }
        ])
        loan_data = next(loan_stats, {})
        ledger_stats = db.ledger.aggregate([
                {
                    "$group": {
                        "_id": None,
                        "totalAmountIssued": { "$sum": { "$toDouble": "$amountIssued" } },
                        "totalAmountPaid": { "$sum": { "$toDouble": "$amountPaid" } }
                    }
                }
            ])
        ledger_data = next(ledger_stats, {})
        total_amount_issued = ledger_data.get("totalAmountIssued", 0)
        total_amount_paid = ledger_data.get("totalAmountPaid", 0)
        

        # Repayment Aggregates
        repayment_stats = db.repayments.aggregate([
                {
                    "$lookup": {
                        "from": "loans",
                        "localField": "loanId",
                        "foreignField": "loanId",
                        "as": "loan"
                    }
                },
                { "$unwind": "$loan" },
                {
                    "$facet": {
                        "activePaid": [
                            { "$match": { "status": "paid", "loan.status": "active" } },
                            {
                                "$group": {
                                    "_id": None,
                                    "paidCount": { "$sum": 1 }
                                }
                            }
                        ],
                        "activeTotal": [
                            { "$match": { "loan.status": "active" } },
                            {
                                "$count": "totalActiveRepayments"
                            }
                        ],
                        "overall": [
                            {
                                "$group": {
                                    "_id": None,
                                    "totalRecoveryAgentAmount": {
                            "$sum": { "$toDouble": "$recoveryAgentAmount" }
                                
                            } }}
                        ]
                    }
                }
            ])

            # Process the results
        repayment_data = next(repayment_stats, {})
        overall_list = repayment_data.get("overall", [])
        overall_data = overall_list[0] if overall_list else {}

        active_paid_list = repayment_data.get("activePaid", [])
        active_paid_data = active_paid_list[0] if active_paid_list else {}

        active_total_list = repayment_data.get("activeTotal", [])
        active_total_data = active_total_list[0] if active_total_list else {}

        # Extract fields
        recovery_agent_amount = overall_data.get("totalRecoveryAgentAmount", 0)
        print(recovery_agent_amount)
        paid_count_active_loans = active_paid_data.get("paidCount", 0)
        total_active_repayment_count = active_total_data.get("totalActiveRepayments", 0)

        # Interest collected
        active_interest = db.repayments.aggregate([
            {
                "$lookup": {
                    "from": "loans",
                    "localField": "loanId",
                    "foreignField": "loanId",
                    "as": "loan"
                }
            },
            { "$unwind": "$loan" },
            {
                "$match": {
                    "status": "paid",
                    "loan.status": "active"
                }
            },
            {
                "$group": {
                    "_id": None,
                    "interestCollected": {
                        "$sum": { "$toDouble": "$interestAmount" }
                    }
                }
            }
        ])
        active_interest_data = next(active_interest, {})
        interest_active = active_interest_data.get("interestCollected", 0)

        # 2. Interest from closed loans (loan.interestAmount)
        closed_interest = db.loans.aggregate([
            {
                "$match": { "status": "closed" }
            },
            {
                "$group": {
                    "_id": None,
                    "interestCollected": {
                        "$sum": { "$toDouble": "$interestAmount" }
                    }
                }
            }
        ])
        closed_interest_data = next(closed_interest, {})
        interest_closed = closed_interest_data.get("interestCollected", 0)

        # 3. Foreclosed loans: sum of interest from repayments + one extra installment
        
        interest_foreclosed = loan_data.get("foreClosedInterest", 0)

        # Combine total interest
        total_interest_collected = round(interest_active + interest_closed + interest_foreclosed, 2)

        # Recent
        new_customers = db.customers.count_documents({"InsertedOn": {"$gte": first_of_month}})
        repayments_this_month = db.repayments.count_documents({
            "status": "paid",
            "paymentDate": {"$gte": first_of_month}
        })

        # Repeat and active customers
        repeat = db.loans.aggregate([
            {"$group": {"_id": "$hpNumber", "count": {"$sum": 1}}},
            {"$match": {"count": {"$gt": 1}}},
            {"$count": "repeatCount"}
        ])
        repeat_count = next(repeat, {}).get("repeatCount", 0)
        active_customers = len(db.loans.distinct("hpNumber", {"status": "active"}))

        # Defaulters
        defaulters = list(db.loans.aggregate([
          # 1️ Step 1: Only active loans
          {
              "$match": {
                  "status": "active"
              }
          },
          # 2️ Step 2: Join repayments for each active loan
          {
              "$lookup": {
                  "from": "repayments",
                  "localField": "_id",
                  "foreignField": "loanId",
                  "as": "repayments"
              }
          },
          # 3️ Step 3: Break out repayment array
          {
              "$unwind": "$repayments"
          },
          # 4️ Step 4: Filter overdue repayments (dueDate < today, not paid)
          {
              "$match": {
                  "repayments.dueDate": {"$lt": today},
                  "repayments.status": {"$ne": "paid"}
              }
          },
          # 5️ Step 5: Group to compute total overdue amount per loan
          {
              "$group": {
                  "_id": "$_id",
                  "hpNumber": {"$first": "$repayments.hpNumber"},
                  "overdueAmount": {"$sum": {"$toDouble": "$repayments.totalAmountDue"}},
                  "loanStatus": {"$first": "$status"}
              }
            }
        ]))
        defaulter_customers = {d["hpNumber"] for d in defaulters if "hpNumber" in d}
        total_overdue = round(sum(d["overdueAmount"] for d in defaulters), 2)
        repayment_rate = round((paid_count_active_loans / total_active_repayment_count) * 100, 2) if total_active_repayment_count else 100

        # Average Loan
        total_loans = loan_data.get("totalLoans", 0)
        amount_issued = loan_data.get("amountIssued", 0)
        penalty_balance = loan_data.get("totalPenaltyBalance",0)
        total_penalty_paid = loan_data.get("dashboardPenalty",0)
        total_agreement_amount = loan_data.get("totalAgreementAmount",0)

        avg_loan = round(amount_issued / total_loans, 2) if total_loans else 0

        return jsonify({
            "status": "success",
            "totals": {
                "customers": db.customers.count_documents({}),
                "loans": total_loans,
                "activeLoans": loan_data.get("activeLoans", 0),
                "closedLoans": loan_data.get("closedLoans", 0),
                "amountIssued": round(total_amount_issued, 2) - round(float(total_agreement_amount or 0),2),
                "amountReceived": round(float(total_amount_paid or 0), 2),
                "interestCollected": round(float(total_interest_collected or 0), 2),
                "penaltyAmount": round(float(total_penalty_paid or 0), 2),
                "penaltyBalance":round(float(penalty_balance or 0),2),
                "agreementFees":round(float(total_agreement_amount or 0),2),
                "netProfit": round(float(total_agreement_amount or 0),2)+ round(float(total_interest_collected or 0), 2) + round(float(total_penalty_paid or 0), 2) - round(float(recovery_agent_amount),2),
                #"recoveryAgentAmount": round(float(recovery_agent_amount),2),
                "actualAmountIssued": round(float(loan_data.get("totalactualAmountIssued",0)), 2)
            },
            "averages": {
                "loanSize": avg_loan,
                "repaymentRatePercent": repayment_rate
            },
            "recent": {
                "newCustomersThisMonth": new_customers,
                "repaymentsThisMonth": repayments_this_month
            },
            "breakdown": {
                "repeatCustomers": repeat_count,
                "customersWithActiveLoans": active_customers
            },
            "defaulters": {
                "count": len(defaulter_customers),
                "overdueAmount": total_overdue,
                "loans": [
                    {
                        "loanId": d["_id"],
                        "hpNumber": d["hpNumber"],
                        "overdueAmount": round(d["overdueAmount"], 2)
                    } for d in defaulters
                ]
            }
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/auto_update_repayments",methods=["POST","OPTIONS"])
def auto_update():
    current_date = datetime.now()
    respone = request.get_json(force=True)
    loan_id = respone["loanId"]
    payment_amount=float(respone["amount"])
    payment_mode =respone["paymentMode"]
    # Step 1: Fetch loan summary
    loan = db.loans.find_one({"loanId": loan_id})
    if not loan:
        return jsonify({"error": "Loan not found"}),404

    total_payable = float(loan.get("totalPayable", 0))
    total_paid = float(loan.get("totalPaid", 0))
    total_remaining = round((total_payable - total_paid),2)

    if payment_amount==0:
        return jsonify({"status":"error","message":"please enter amount > 0"}),400

    if payment_amount > total_remaining:
        return jsonify({
            "message": "Excess amount provided",
            "amountAllowed": total_remaining,
            "amountGiven": payment_amount,
            "status":"error"
        }),400

    # Step 2: Determine how much of the payment can be allocated
    allocatable_amount = min(payment_amount, total_remaining)
    unallocated_amount = max(0, payment_amount - total_remaining)
    remaining = allocatable_amount

    # Step 3: Fetch unpaid or partially paid EMIs (sorted oldest first)
    try:
        repayments = db.repayments.find({
            "loanId": loan_id,
            "status": {"$ne": "paid"}
        }).sort("dueDate", 1)

        bulk_updates = []

        for r in repayments:
            emi_id = r["_id"]
            total_due = float(r.get("totalAmountDue", 0))
            already_paid = float(r.get("amountPaid", 0))
            remaining_due = total_due - already_paid
            payment_id = generate_unique_payment_id()
            if remaining_due <= 0:
                continue

            if remaining >= remaining_due:
                new_paid = total_due
                new_status = "paid"
                used_amount = remaining_due
            else:
                new_paid = already_paid + remaining
                new_status = "partial"
                used_amount = remaining

            update_doc = {
                "amountPaid": str(new_paid),
                "status": new_status,
                "paymentDate": current_date,
                "paymentId": payment_id,
                "paymentMode": payment_mode,
                "updatedOn": current_date,
                "remainingPayment": str(total_due - new_paid)
            }

            bulk_updates.append(UpdateOne({"_id": emi_id}, {"$set": update_doc}))

            remaining -= used_amount
            if remaining <= 0:
                break

        # Step 4: Execute bulk EMI updates
        if bulk_updates:
            db.repayments.bulk_write(bulk_updates)

        # Step 5: Update the loan summary
        new_total_paid = total_paid + allocatable_amount
        new_total_due = total_payable - new_total_paid

        db.loans.update_one(
            {"loanId": loan_id},
            {
                "$set": {
                    "totalPaid": str(new_total_paid),
                    "totalAmountDue": str(new_total_due)
                }
            }
        )

        db.ledger.insert_one({
        "hpNumber": loan["hpNumber"],
        "loanId": loan_id,
        "paymentId": payment_id,
        "paymentMode": payment_mode,
        "amountPaid": payment_amount,
        "paymentDate": current_date,
        "createdOn": current_date
         })
        # Step 6: Return summary
        return {
            "status":"success",
            "loanId": loan_id,
            "allocatedAmount": allocatable_amount,
            "unallocatedAmount": unallocated_amount,
            "remainingLoanBalance": new_total_due,
            "message":"Db updated Successfully"
        }
    except Exception as e:
        return jsonify({"status":"error","message":str(e)})

@app.route("/foreclose", methods=['POST',"OPTIONS"])
def foreclose():
    data = request.get_json(force=True)
    
    keys = ["loanId","foreCloseNetInterest","recentInstallment","tenure","hpNumber","customBalance","paymentMode"]
    missing = [key for key in keys if key not in data]
    if missing:
        return jsonify({"status":"error","message":f"Missing required keys {missing}"}),400
    
    loan_id =data["loanId"]
    loan = db.loans.find_one({"loanId":loan_id})
    status = loan["status"]
    pending_balance = float(data["customBalance"])
    total_paid = float(loan.get("totalPaid",0))
    total_payable = total_paid + pending_balance
            
    
    fore_close_net_Interest = data["foreCloseNetInterest"]
    recent_installment = data["recentInstallment"]
    tenure = data["tenure"]
    customer_id = data["hpNumber"]
    payment_mode = data["paymentMode"]
    total_Pay_With_Penalty = total_payable+ float(loan["totalPenalty"])

    if (status != "closed" and status != "foreclosed") and (recent_installment != tenure):
        try:
            update = db.loans.update_one(
                {"loanId": loan_id},
                {
                    "$set": {
                        "status": "foreclosed",
                        "totalPayable": str(total_payable),
                        "totalAmountDue": "0",
                        "updatedOn": datetime.now(),
                        "totalPaid":float(total_payable),
                        "foreCloseNetInterest": str(fore_close_net_Interest),
                        "totalPayWithPenalty": str(total_Pay_With_Penalty)
                    }
                }
            )

            update_ledger = db.ledger.insert_one({
                "hpNumber": customer_id,
                "loanId": loan_id,
                "paymentId": generate_unique_payment_id(),
                "paymentMode": payment_mode,  # <-- Make sure this is a date, not a variable misused
                "createdOn": datetime.now(),
                "paymentDate": datetime.now(),
                "amountPaid": round(pending_balance, 2)
            })
            if update.modified_count > 0:
                return jsonify({"status": "success", "message": "DB updated successfully"}),200
            else:
                return jsonify({"status": "error", "message": "DB was not updated"}),401

        except Exception as e:
            return jsonify({"status": "error", "message": str(e)})
    else:
        return jsonify({"status": "error", "message": "Loan was already closed"})


@app.route("/foreclose_balance",methods=["POST","OPTIONS"])
def foreclose_balance():
    try:
        data = request.get_json(force=True)
        loan_id =data["loanId"]
        loan =  db.loans.find_one({"loanId":loan_id})
        loan_amount = loan["loanAmount"]
        hpNumber =  loan["hpNumber"]
        tenure= float(loan["loanTerm"])
        paid_till_date =loan.get("totalPaid",0)
        monthly_interest =  round((float(loan["interestAmount"])/tenure),2)



        recent_install = db.repayments.find_one(
                                        {
                                                "hpNumber": hpNumber,
                                                "loanId": loan_id,
                                                "status": { "$in": ["paid", "partial"] }
                                                            
                                            },
                                        {"installmentNumber": 1, "_id": 0},
                                        sort=[("installmentNumber", -1)]
                                    )
        recent_installment = recent_install["installmentNumber"] if recent_install else 1

    # Extract the result 
        if (recent_installment < 3 and (tenure-recent_installment) >=3) :
            foreCloseNetInterest = round((monthly_interest*3),2)
            totalPayable = float(loan_amount) + foreCloseNetInterest
            pending_balance = float(totalPayable)-float(paid_till_date)
            return jsonify({"status":"success","pendingBalance":round(float(pending_balance),2),"totalPayable":totalPayable,
                            "foreCloseNetInterest":foreCloseNetInterest,
                            "pendingBalance":pending_balance,"recentInstallment":recent_installment,"tenure":tenure})
        else:
            foreCloseNetInterest = round((monthly_interest*(tenure-recent_installment)),2)
            totalPayable = float(loan_amount) + foreCloseNetInterest
            pending_balance = float(totalPayable)-float(paid_till_date)
            return jsonify({"status":"success","pendingBalance":round(float(pending_balance),2),"totalPayable":totalPayable,
                            "foreCloseNetInterest":foreCloseNetInterest,
                            "pendingBalance":pending_balance,"recentInstallment":recent_installment,"tenure":tenure})
            
        
    except Exception as e:
        return jsonify({"status":"error","message":str(e)})
    
@app.route("/pay_penalty",methods=["POST","OPTIONS"])
def pay_penalty():
    required_fields = ["penaltyDuePaid", "loanId", "penaltyBalance", "hpNumber", "paymentMode","penaltyPaid"]
    data = request.get_json(force=True)
    # Check for missing fields
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"status":"error", "message":f"Missing required fields: {', '.join(missing)}"}), 400
    data = request.get_json(force=True)
    paid_due_paid= round(float(data["penaltyDuePaid"]),2)
    penalty_paid = round(float(data["penaltyPaid"]),2)
    paid_penalty = paid_due_paid + penalty_paid
    loan_id = data["loanId"]
    penaltyBalance = round(float(data["penaltyBalance"]),2)
    penaltyBalance -= paid_due_paid
    hpNumber = data["hpNumber"]
    paymentMode = data["paymentMode"]
    if penaltyBalance  < 0:
        return jsonify({"status":"error","message":"Penalty already paid"}),400
    try:
        db.loans.update_one(
                { "loanId": loan_id },
                {
                    "$set": { "penaltyPaid": paid_penalty,
                     "penaltyBalance": penaltyBalance }
                }
            )
        db.ledger.insert_one({
            "hpNumber": hpNumber,"loanId" : loan_id,"paymentId": generate_unique_payment_id(),
            "paymentMode": paymentMode,
            "paymentDate": datetime.now(),
            "createdOn": datetime.now(),
            "amountPaid":paid_penalty,
        })
        return jsonify({"status":"success","message":"Penalty updated !"}),200
    except Exception as e:
        return jsonify({"status":"error","message":f"{str(e)}"}),400
    

def is_not_greater_than_one_month(start_date, end_date):
    if end_date < start_date:
        start_date, end_date = end_date, start_date

    diff = relativedelta(end_date, start_date)
    months = diff.years * 12 + diff.months

    # Check: more than 1 month (not equal to 1)
    if months > 1 or (months == 1 and diff.days > 0):
        return False
    return True
    

def calculate_penalty(start_date, end_date, monthly_penalty=300,grace_days=3):
    if end_date < start_date:
        return 0, 0  # consistent tuple return

    delta = end_date - start_date

    # No penalty if overdue by 4 or fewer days
    if delta.days <= grace_days:
        return 0, 0

    diff = relativedelta(end_date, start_date)
    months = diff.years * 12 + diff.months

    if diff.days > 0:
        months += 1  # Round up if even a partial month

    return months * monthly_penalty, months



def update_total_penalties():
    pipeline = [ 
        {
            "$group": {
                "_id": "$loanId",
                "totalPenaltySum": {
                    "$sum": {
                        "$add": [
                            { "$toDouble": { "$ifNull": ["$penalty", 0] } },
                            { "$toDouble": { "$ifNull": ["$recoveryAgentAmount", 0] } }
                        ]
                    }
                }
            }
        }
    ]

    penalty_totals = db.repayments.aggregate(pipeline)

    bulk_updates = []
    for doc in penalty_totals:
        loan = db.loans.find_one({ "loanId": doc["_id"], "status": "active" })
        if loan:
            penalty_paid = float(loan.get("penaltyPaid", 0))
            total_penalty = float(doc["totalPenaltySum"])
            penalty_balance = total_penalty - penalty_paid
            total_payable = float(loan.get("totalPayable", 0))
            PayWithPenalty = total_payable + total_penalty
            #print(total_penalty,penalty_balance,PayWithPenalty)
            bulk_updates.append(
                UpdateOne(
                    { "loanId": doc["_id"], "status": "active" },
                    {
                        "$set": {
                            "totalPenalty": total_penalty,
                            "penaltyBalance": penalty_balance,
                            "totalPayWithPenalty" :PayWithPenalty
                        }
                    }
                )
            )

    if bulk_updates:
        result = db.loans.bulk_write(bulk_updates)
        print("success")
    else:
        print("failed")


def apply_monthly_penalties_new():
    PENALTY_PER_MONTH = 300
    GRACE_PERIOD_DAYS = 3

    try:
        repayments_col = db.repayments
        loans_col = db.loans

        current_date = datetime.now(ZoneInfo("Asia/Kolkata"))

        # Get active loan IDs
        active_loans_cursor = loans_col.find(
            {"status": "active"},
            {"loanId": 1, "_id": 0}
        )
        active_loan_ids = {doc["loanId"] for doc in active_loans_cursor}

        # Fetch ALL unpaid repayments (important for correction)
        active_repayments = repayments_col.find({
            "status": {"$ne": "paid"}
        })

        bulk_updates = []

        for repayment in active_repayments:
            repayment_id = repayment["_id"]
            loan_id = repayment.get("loanId")

            # Skip non-active loans
            if loan_id not in active_loan_ids:
                continue

            due_date = repayment.get("dueDate")
            if not due_date:
                continue

            due_date = due_date.replace(tzinfo=ZoneInfo("Asia/Kolkata"))

            existing_penalty = float(repayment.get("penalty", 0))
            existing_months = int(repayment.get("totalPenaltyMonths", 0))

            # ----------------------------
            # 🟥 CASE 1: WRONG PENALTY ENTERED (current_date < dueDate)
            # ----------------------------
            if current_date < due_date:
                if existing_penalty != 0 or existing_months != 0:
                    bulk_updates.append(
                        pymongo.UpdateOne(
                            {"_id": repayment_id},
                            {
                                "$set": {
                                    "penalty": 0,
                                    "totalPenaltyMonths": 0,
                                    "updatedOn": current_date,
                                    "penaltyAutoCorrected": True
                                }
                            }
                        )
                    )
                continue

            # ----------------------------
            # 🟩 CASE 2: VALID OVERDUE – CALCULATE PENALTY
            # ----------------------------
            penalty, months = calculate_penalty(
                due_date,
                current_date,
                monthly_penalty=PENALTY_PER_MONTH,
                grace_days=GRACE_PERIOD_DAYS
            )

            # Update only if penalty increased
            if months > existing_months:
                bulk_updates.append(
                    pymongo.UpdateOne(
                        {"_id": repayment_id},
                        {
                            "$set": {
                                "penalty": penalty,
                                "totalPenaltyMonths": months,
                                "updatedOn": current_date
                            }
                        }
                    )
                )

        # ----------------------------
        # 🔁 EXECUTE BULK UPDATE
        # ----------------------------
        if bulk_updates:
            result = repayments_col.bulk_write(bulk_updates)
            update_total_penalties()
            print(
                f"status:Success | Penalties processed | Updated: {result.modified_count}"
            )
        else:
            # Still recalc totals to self-heal loan level data
            update_total_penalties()
            print("status:Success | No penalty changes required")

    except Exception as e:
        print(f"status:Error | message: {str(e)}")

@app.route("/update_penalty_new", methods=['GET',"OPTIONS"])
def calculate_monthly_penalty():
    try:
        # Start the penalty application in a background thread
        thread = Thread(target=apply_monthly_penalties_new)
        thread.start()
        return jsonify({"status": "Processing", "message": "Penalty update started in background."}), 202
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500





@app.route("/")
def home():
    return jsonify({"message": "API is running"})

if __name__ == '__main__':

    app.run()



