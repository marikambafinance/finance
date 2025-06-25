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
from dateutil.relativedelta import relativedelta



app = Flask(__name__)
CORS(app)
account_sid = 'your_account_sid'  # Find in Twilio Console
auth_token = 'your_auth_token'    # Find in Twilio Console
twilio_whatsapp_number = 'whatsapp:+14155238886'
Client = Client(account_sid, auth_token)
mongo_uri = os.getenv("MONGO_URI")

client = MongoClient(mongo_uri)
db = client.users
collection = db.customers



def calculate_penalty(start_date, end_date, monthly_penalty=500):
    if end_date < start_date:
        return 0  # or raise error if needed

    delta = end_date - start_date

    # Rule: No penalty if <= 5 days
    if delta.days <= 5:
        return 0

    # Else calculate months + 1 if any extra days
    diff = relativedelta(end_date, start_date)
    months = diff.years * 12 + diff.months

    # Add one more month if there's any remaining days
    if diff.days > 0:
        months += 1

    return months * monthly_penalty, months

def calculate_months_overdue(due_date, current_date,GRACE_PERIOD_DAYS):
    if current_date < due_date + timedelta(days=GRACE_PERIOD_DAYS):
        return 0
    diff_years = current_date.year - due_date.year
    diff_months = current_date.month - due_date.month
    total_months = (diff_years * 12) + diff_months
    if current_date.day < due_date.day:
        total_months -= 1
    return max(0, total_months)

@app.route("/remainder_whatsapp", methods=['GET'])
def remainder():
    remainder = db.repayments
    now_ist = datetime.now()
    three_days_later = now_ist + timedelta(days=3)

    # Query repayments due in next 3 days and not paid
    repayments = remainder.find({
        "status": {"$ne": "paid"},
        "$or": [
        {"dueDate": {"$gte": now_ist, "$lte": three_days_later}},
        {"dueDate": {"$lt": now_ist}}
    ]
    })
    for repayment in repayments:
        customer_id = repayment.get("hpNumber")
        if not customer_id:
            continue
        user = collection.find_one({"hpNumber": customer_id})
        if not user:
            continue
        name = user.get("firstName") + " " + user.get("lastName")
        phone = "+91"+str(user.get("phone"))  # Must be in +91XXXXXXXXXX format
        if not phone:
            continue
        amount = repayment.get("totalAmountDue", 0)
        due_date = repayment.get("dueDate")+timedelta(hours=5,minutes=30)
        due_date_str = due_date.strftime("%d-%b-%Y")
        message = (
            f"Hi {name},\n\n"
            f"This is a reminder that your loan repayment of ₹{amount} is due on {due_date_str}.\n"
            "Please pay before the due date to avoid penalties.\n\nThank you!"
        )
        try:
            # Schedule message 2 minutes from now (local time)
            now_local = datetime.now(ZoneInfo("Asia/Kolkata"))
            send_hour = now_local.hour
            send_minute = now_local.minute + 2

            if send_minute >= 60:
                send_minute -= 60
                send_hour = (send_hour + 1) % 24

            print(f"Scheduling message to {phone} at {send_hour}:{send_minute}")
            mess = client.messages.create(
                body=message,
                from_=twilio_whatsapp_number,
                to=f'whatsapp:{phone}'  # Replace with recipient's number
            )
            #kit.sendwhatmsg(phone, message, send_hour, send_minute)
            #time.sleep(2)  # wait to avoid too many rapid opens
        except Exception as e:
            return jsonify({f"Error sending message to {phone}": f"{e}"}),400
    return jsonify({"status": "success","message":"Remainder messagges sent"}),200


@app.route("/")
def home():
    return jsonify({"message": "API is running"})


@app.route("/update_penalty_new", methods=['GET'])
def apply_monthly_penalties_new(): 
    PENALTY_PER_MONTH = 300
    GRACE_PERIOD_DAYS = 5
    try:
        remainder_collection = db.repayments
        current_date = datetime.now(ZoneInfo("Asia/Kolkata"))
        overdue_repayments = remainder_collection.find({
            "status": {"$ne": "paid"},
            "dueDate": {"$lt": current_date} # Initial filter: due date is in the past
        })

        bulk_updates = []
        for repayment in overdue_repayments:
            print(repayment)
            repayment_id = repayment['_id']
            due_date = repayment['dueDate'] # Assuming this is a datetime object from MongoDB
            due_date = due_date.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
            print(current_date,due_date)
            emi = float(repayment["amountDue"])
            penalty,months = calculate_penalty(due_date,current_date)
            bulk_updates.append(
                {
                    "filter": {"_id": repayment_id},
                    "update": {
                        "$set": {
                            "updatedOn": current_date, # Set last update time
                            "TotalPenaltyMonths": months,
                            "penalty": penalty,
                            "totalAmountDue": str(emi+penalty)
                            }
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
            return jsonify({"status":"Success","message":f"Penalties updated for {result.modified_count}"}),200
        else:
            return jsonify({"status":"Success","message":"No records to update"}),200
    except Exception as e:
        return jsonify({"status":"error","message":str(e)})


if __name__ == '__main__':
    app.run()