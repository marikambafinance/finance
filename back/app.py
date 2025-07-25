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
from pymongo import MongoClient, UpdateOne
from dateutil.relativedelta import relativedelta
import smtplib
from email.mime.text import MIMEText
import hashlib
from dotenv import load_dotenv
from  threading import Thread


app = Flask(__name__)
CORS(app)
load_dotenv()
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_USERNAME = "marikambafinance@gmail.com"
EMAIL_PASSWORD = "Marikamba@0615"
mongo_uri = os.getenv("MONGO_URI")
EXPECTED_API_KEY =os.getenv("EXPECTED_API_KEY")

client = MongoClient(mongo_uri)
db = client.users
collection = db.customers


def send_due_soon_emails(records):
    """
    records: List of dicts with keys: name, email, due_date (YYYY-MM-DD)
    Sends an email if due date is within 3 days from today.
    """
    today = datetime.today().date()   
    threshold_date = today + timedelta(days=3)

    for record in records:
        name = record.get("name")
        email = record.get("email")
        due_date_str = record.get("dueDate")

        if not email or not due_date_str:
            continue

        try:
            due_date = due_date_str.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
            due_date = due_date.date()
            print(due_date)

            if today <= due_date <= threshold_date:
                # Send email
                subject = "Payment Due Reminder"
                body = f"Dear {name},\n\nThis is a reminder that your payment is due on {due_date}. Please ensure timely payment to avoid penalties.\n\nRegards,\nBilling Team"

                msg = MIMEText(body)
                msg["Subject"] = subject
                msg["From"] = EMAIL_USERNAME
                msg["To"] = email

                with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                    server.starttls()
                    server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
                    server.sendmail(EMAIL_USERNAME, email, msg.as_string())

                return {"mesage":f"Sent email to {name} at {email}"}
            
            return {"message":"No emails sent"}

        except Exception as e:
            print(f"Error processing record for {email}: {e}")

def calculate_penalty(start_date, end_date, monthly_penalty=300):
    if end_date < start_date:
        return 0, 0  # consistent tuple return

    delta = end_date - start_date

    # No penalty if overdue by 5 or fewer days
    if delta.days <= 5:
        return 0, 0

    diff = relativedelta(end_date, start_date)
    months = diff.years * 12 + diff.months

    if diff.days > 0:
        months += 1  # Round up if even a partial month

    return months * monthly_penalty, months


def is_not_greater_than_one_month(start_date, end_date):
    if end_date < start_date:
        start_date, end_date = end_date, start_date

    diff = relativedelta(end_date, start_date)
    months = diff.years * 12 + diff.months

    # Check: more than 1 month (not equal to 1)
    if months > 1 or (months == 1 and diff.days > 0):
        return False
    return True


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
            PayWithPenalty = float(loan.get("totalPayWithPenalty",0)) + total_penalty
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

    

def calculate_months_overdue(due_date, current_date,GRACE_PERIOD_DAYS):
    if current_date < due_date + timedelta(days=GRACE_PERIOD_DAYS):
        return 0
    diff_years = current_date.year - due_date.year
    diff_months = current_date.month - due_date.month
    total_months = (diff_years * 12) + diff_months
    if current_date.day < due_date.day:
        total_months -= 1
    return max(0, total_months)

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

@app.route("/send_remainder_email",methods=["GET","OPTIONS"])
def send_remainder():
    today = datetime.now()
    threshold_date = today +timedelta(days=3)
    data = list(db.repayments.find({
            "dueDate": {
                "$gte": today,
                "$lte": threshold_date
            },
            "status": { "$ne": "paid" }  # not equal to 'paid'
        },{"hpNumber":1,"dueDate":1,"_id":0}))

    for details in data:
        result  = db.customers.find_one({"hpNumber":details["hpNumber"]},{"firstName":1,"lastName":1,"email":1,"_id":0})
        details["name"],details["email"] = result["firstName"] +" " + result["lastName"], result["email"]
    
    print(data)
    if data:
        return jsonify(send_due_soon_emails(data))
         
    return jsonify({"messages":"No emails were sent"}),200


@app.route("/")
def home():
    return jsonify({"message": "API is running"})


def apply_monthly_penalties_new(): 
    PENALTY_PER_MONTH = 300
    GRACE_PERIOD_DAYS = 5
    try:
        remainder_collection = db.repayments
        current_date = datetime.now(ZoneInfo("Asia/Kolkata"))
        active_loans_cursor = db.loans.find({"status":{"$eq":"active"}},{"loanId":1,"_id":0})
        active_loan_ids = [doc["loanId"] for doc in active_loans_cursor]
        overdue_repayments = remainder_collection.find({
            "status": {"$ne": "paid"},
            "dueDate": {"$lt": current_date} # Initial filter: due date is in the past
        })

        bulk_updates = []
        for repayment in overdue_repayments:
            repayment_id = repayment['_id']
            if repayment["loanId"] in active_loan_ids:
                due_date = repayment['dueDate'] # Assuming this is a datetime object from MongoDB
                due_date = due_date.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
                updatedOn = repayment.get("updatedOn",None)
        
                if updatedOn:
                    updatedOn = updatedOn.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
            
                if updatedOn and is_not_greater_than_one_month(updatedOn,current_date) :
                    pass
                else:
                    #previousDues = float(repayment.get("previousDues",0))
                    penalty,months = calculate_penalty(due_date,current_date)
                    bulk_updates.append(
                        {
                            "filter": {"_id": repayment_id},
                            "update": {
                                "$set": {
                                    "updatedOn": current_date, # Set last update time
                                    "totalPenaltyMonths": months,
                                    "penalty": penalty,
                                    },
                            }
                        }
                    )
        if bulk_updates:
        # Execute bulk updates
            req = []
            for item in bulk_updates:
                req.append(
                    pymongo.UpdateOne(item["filter"], item["update"])
                )
            result = remainder_collection.bulk_write(req)
            update_total_penalties()
            print(f"status:Success,message:Penalties updated for {result.modified_count}")
        else:
            print("status: Success,message:No records to update")
    except Exception as e:
        print(f"status:error,message:{str(e)}")



@app.route("/update_penalty_new", methods=['GET',"OPTIONS"])
def calculate_monthly_penalty():
    try:
        # Start the penalty application in a background thread
        thread = Thread(target=apply_monthly_penalties_new)
        thread.start()
        return jsonify({"status": "Processing", "message": "Penalty update started in background."}), 202
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    app.run()