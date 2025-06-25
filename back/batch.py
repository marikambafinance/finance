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
CORS(app)
account_sid = 'your_account_sid'  # Find in Twilio Console
auth_token = 'your_auth_token'    # Find in Twilio Console
twilio_whatsapp_number = 'whatsapp:+14155238886'
Client = Client(account_sid, auth_token)
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client.users
collection = db.customers


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

@app.route("/update_penalty", methods=['GET'])
def apply_monthly_penalties(): 
    PENALTY_PER_MONTH = 300
    GRACE_PERIOD_DAYS = 5
    try:
        remainder_collection = db.repayments
        print(remainder_collection)
        now_ist = datetime.now(ZoneInfo("Asia/Kolkata"))
        overdue_repayments = remainder_collection.find({
            "status": {"$ne": "paid"},
            "dueDate": {"$lt": now_ist} # Initial filter: due date is in the past
        })

        bulk_updates = []
        for repayment in overdue_repayments:
            print(repayment)
            repayment_id = repayment['_id']
            due_date = repayment['dueDate'] # Assuming this is a datetime object from MongoDB
            emi = repayment["amountDue"]

            due_date = due_date.astimezone(ZoneInfo("Asia/Kolkata"))
            grace_period_end_date = due_date + timedelta(days=GRACE_PERIOD_DAYS)
            if now_ist < grace_period_end_date:
                continue
            last_penalty_applied_months = repayment.get('lastPenaltyAppliedMonths', 0)
            current_total_penalty_applied = repayment.get('penalty', 0)
            months_overdue_actual = calculate_months_overdue(due_date, now_ist,GRACE_PERIOD_DAYS)
            penalty_this_run  = 0
            if months_overdue_actual > last_penalty_applied_months:
                new_months_to_penalize = months_overdue_actual - last_penalty_applied_months
                penalty_this_run = new_months_to_penalize * PENALTY_PER_MONTH
                updated_total_penalty_applied = current_total_penalty_applied + penalty_this_run

                bulk_updates.append(
                    {
                        "filter": {"_id": repayment_id},
                        "update": {"$inc": {
                                "totalAmountDue": penalty_this_run # Increment existing totalEmi (which now includes base + penalties)
                            },
                            "$set": {
                                "updatedOn": now_ist, # Set last update time
                                "lastPenaltyAppliedMonths": months_overdue_actual,
                                "penalty": updated_total_penalty_applied
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