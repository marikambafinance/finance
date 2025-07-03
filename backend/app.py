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
import hashlib
from dateutil.relativedelta import relativedelta
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
        {"hpNumber": {"$regex": f"^{year_prefix}[A-Z]{{2}}\d{{5}}$"}},
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
        monthly_interest = round((loan_amount * interest_rate) / (100 * tenure), 2)

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
                "totalPenalty":0,
                "recoveryAgentAmount":0,
                "customPenalty":0,
                "totalAmountDue": str(emi),
                "interestAmount": str(monthly_interest),
                "updatedOn": None,
                "remainingPayment":str(emi)
            })

        result = db.repayments.insert_many(repayment_entries)
        return {"status": "success", "insertedCount": len(result.inserted_ids)}

    except Exception as e:
        return {"status": "error", "message": str(e)}
    


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

                            # Lookup loans (array of loans or empty)
                            {
                                "$lookup": {
                                    "from": "loans",
                                    "localField": "hpNumber",
                                    "foreignField": "hpNumber",
                                    "as": "loans"
                                }
                            },

                            # Lookup all repayments and group by loanId
                            {
                                "$lookup": {
                                    "from": "repayments",
                                    "pipeline": [
                                        {
                                            "$match": {
                                                "status": "paid"
                                            }
                                        },
                                        {
                                            "$group": {
                                                "_id": "$loanId",
                                                "total_paid": {"$sum": {"$toDouble": "$amountPaid"}},
                                                 "paid_count": { "$sum": 1 }
                                            }
                                        }
                                    ],
                                    "as": "repayment_totals"
                                }
                            },

                            # Merge repayment total into each loan
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
                                                            "total_paid": {
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
                                                                                },
                                                                            },
                                                                            "in": "$$match.total_paid"
                                                                        }
                                                                    },
                                                                    0
                                                                ]
                                                            },
                                                            "paid_count": {
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
                                                                                },
                                                                            },
                                                                            "in": "$$match.paid_count"
                                                                        }
                                                                    },
                                                                    0
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                },

                            # Remove the repayment_totals array
                            {
                                "$project": {
                                    "repayment_totals": 0
                                }
                            }
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
    result = serialize_object_ids(result)
    return list(result)


def insert_loan_data(loan_data):
    #print(loan_data)
    if "hpNumber" in loan_data.keys():
        loan_data["loanId"] = generate_loan_id(loan_data.get("hpNumber"))
        loan_data["status"] = "active"
        loan_data["totalAmountDue"] =loan_data["totalPayable"]
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
    exempt_routes = ['home']
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
        #print(result)
        if "error" in res:
            return jsonify({"status": "error", "message": res["error"]}), 400

        return jsonify({"status": "success", "response":res["data"]}), 200

    except Exception as e:
        
        traceback.print_exc()  # prints full error traceback to logs
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
    
@app.route("/update_repayment",methods=["POST","OPTIONS"])
def update_repayment():
    data = request.get_json(force=True)
    required_keys = {
        "amountPaid", "status", "paymentMode", "recoveryAgent",
        "totalAmountDue", "loanId", "installmentNumber","penalty","totalPenalty","recoveryAgentAmount","customPenalty","remainingPayment",
        "customPenaltyCheck"
    }

    missing_keys = required_keys - data.keys()
    if missing_keys:
        return jsonify({
            "status": "error",
            "message": f"The following keys are missing: {', '.join(missing_keys)}"
        }), 400
    if (float(data.get("totalAmountDue",0)<=float(data.get("amountPaid",0)))):
        return jsonify({
            "status": "error",
            "message": f"Payment was already made, Unable to update"
        }), 200
    # Extract and clean inputs
    loan_id = data["loanId"].strip()
    installment_number = int(data["installmentNumber"])
    new_amount_paid = float(data["amountPaid"])
    status = data["status"]
    payment_mode = data["paymentMode"]
    recovery_agent = data["recoveryAgent"]
    total_amount_due = float(data.get("totalAmountDue", 0)) # convert to float if stored as numeric in DB
    penalty = str(data["penalty"])
    totalPenalty = data.get("totalPenalty",0)
    recoveryAgentAmount = str(data["recoveryAgentAmount"])
    customPenalty = str(data["customPenalty"])
    remainingPayment =str(data["remainingPayment"])
    customPenaltyCheck = data["customPenaltyCheck"]
    payment_id = generate_unique_payment_id()
    payment_date= datetime.now(ZoneInfo("Asia/Kolkata"))
    if float(remainingPayment)<0:
        return jsonify({"status":"error","message":"Remaining balance cannot be negative"})
    if status=="partial":
        amount_paid = db.repayments.find_one({"loanId":loan_id,"installmentNumber":installment_number},{"amountPaid":1,"_id":0})
        new_amount_paid+= float(amount_paid["amountPaid"])

        if (new_amount_paid>=total_amount_due ):
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
                "totalPenalty":totalPenalty,
                "recoveryAgentAmount":recoveryAgentAmount,
                "customPenalty": customPenalty,
                "remainingPayment":remainingPayment,
                "customPenaltyCheck":customPenaltyCheck

            }}
        )
        hpNumber = db.loans.find_one({"loanId":loan_id},{"hpNumber":1,"_id":0})
        update_ledger = db.ledger.insert_one({
            "hpNumber":hpNumber["hpNumber"],
            "loanId":loan_id,
            "paymentId":payment_id,
            "paymentMode":payment_mode,
            "amountPaid":new_amount_paid if status!="partial" else new_amount_paid-float(amount_paid["amountPaid"]),
            "paymentDate":payment_date
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
            }
        }
    }
])

        data = next(loan_res, None)
        total_payable = round(data["totalPayable"], 2)
        total_paid = round(data["totalPaid"], 2)
        total_amount_due = total_payable-total_paid
        update_result = db.loans.update_one(
            {"loanId": loan_id},
            {"$set": {"totalPayable": str(total_payable),"totalPaid":str(total_paid),
                      "totalAmountDue":str(total_amount_due)}}
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
                    "closedLoans": {"$sum": {"$cond": [{"$eq": ["$status", "closed"]}, 1, 0]}},
                    "amountIssued": {"$sum": {"$toDouble": "$loanAmount"}}
                }
            }
        ])
        loan_data = next(loan_stats, {})

        # Repayment Aggregates
        repayment_stats = db.repayments.aggregate([
                {
                    "$facet": {
                        "total": [
                            {"$count": "totalCount"}
                        ],
                        "paid": [
                            {"$match": {"status": "paid"}},
                            {
                                "$group": {
                                    "_id": None,
                                    "amountReceived": {"$sum": {"$toDouble": "$amountPaid"}},
                                    "paidCount": {"$sum": 1},
                                    "penaltyAmount": {"$sum": {"$toDouble": "$penalty"}},
                                    "recoveryCount": {
                                        "$sum": {
                                            "$cond": [
                                                {"$eq": ["$recoveryAgent", True]},
                                                1,
                                                0
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            ])
        stats = next(repayment_stats, {})
        paid_data_list = stats.get("paid", [])
        paid_data = paid_data_list[0] if paid_data_list else {}
        paid_count = paid_data.get("paidCount", 0)
        total_data_list = stats.get("total", [])
        total_count = total_data_list[0].get("totalCount", 0) if total_data_list else 0

        # Interest collected
        interest_data = db.repayments.aggregate([
            {"$match": {"status": "paid"}},
            {
                "$group": {
                    "_id": None,
                    "interestCollected": {"$sum": {"$toDouble": "$interestAmount"}}
                }
            }
        ])
        interest = next(interest_data, {"interestCollected": 0})

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
        defaulters = list(db.repayments.aggregate([
            {"$match": {"dueDate": {"$lt": today}, "status": {"$ne": "paid"}}},
            {
                "$group": {
                    "_id": "$loanId",
                    "overdueAmount": {"$sum": {"$toDouble": "$totalAmountDue"}},
                    "hpNumber": {"$first": "$hpNumber"}
                }
            }
        ]))
        defaulter_customers = {d["hpNumber"] for d in defaulters if "hpNumber" in d}
        total_overdue = round(sum(d["overdueAmount"] for d in defaulters), 2)
        repayment_rate = round((paid_count / total_count) * 100, 2) if total_count else 0

        # Average Loan
        total_loans = loan_data.get("totalLoans", 0)
        amount_issued = loan_data.get("amountIssued", 0)
        avg_loan = round(amount_issued / total_loans, 2) if total_loans else 0

        return jsonify({
            "status": "success",
            "totals": {
                "customers": db.customers.count_documents({}),
                "loans": total_loans,
                "activeLoans": loan_data.get("activeLoans", 0),
                "closedLoans": loan_data.get("closedLoans", 0),
                "amountIssued": round(amount_issued, 2),
                "amountReceived": round(paid_data.get("amountReceived", 0), 2),
                "interestCollected": round(interest.get("interestCollected", 0), 2),
                "penaltyAmount": round(paid_data.get("penaltyAmount", 0), 2),
                "recoveryAgentAmount": paid_data.get("recoveryCount", 0) * 500
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
    
    
@app.route("/")
def home():
    return jsonify({"message": "API is running"})

if __name__ == '__main__':
    app.run()
