import asyncio
import time
import os
from dotenv import load_dotenv

load_dotenv()

# TODO: Uncomment these two lines when Firebase is connected
# from db.firestore import db

async def process(uid: str, claim_id: str, amount: int) -> dict:
    
    # TODO: Replace this mock UPI handle with real Firestore fetch
    # user_doc = db.collection("users").document(uid).get()
    # user = user_doc.to_dict()
    # upi_handle = user.get("upi_handle", f"{uid[:6].lower()}@upi")
    upi_handle = f"{uid[:6].lower()}@upi"  # mock handle until Firebase is ready

    # Generate mock transaction ID
    timestamp = int(time.time())
    transaction_id = f"UPI{timestamp}{uid[:6].upper()}"

    # Simulated 2 second delay to feel realistic
    await asyncio.sleep(2)

    # TODO: Uncomment this when Firebase is connected
    # db.collection("claims").document(claim_id).update({
    #     "payout_status": "paid",
    #     "transaction_id": transaction_id,
    #     "paid_at": time.time(),
    #     "upi_handle": upi_handle
    # })

    return {
        "status": "paid",
        "amount": amount,
        "upi_handle": upi_handle,
        "transaction_id": transaction_id,
        "receipt_message": f"₹{amount} sent to {upi_handle} · Ref: {transaction_id}"
    }
