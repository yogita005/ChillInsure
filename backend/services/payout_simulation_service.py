"""
ChillInsure UPI Payout Simulation Service
Simulates instant UPI transfers for approved claims
Tracks payout history and settlement status
"""

from typing import Dict, List
from datetime import datetime
import random
import string

class PayoutSimulationService:
    """
    Simulates instant parametric payouts to gig workers
    - Generates UPI transaction IDs
    - Tracks settlement status
    - Records payout history
    """
    
    def __init__(self):
        self.payout_history = {}
        self.settlement_time_seconds = 2  # Simulated instant settlement
    
    def generate_transaction_id(self) -> str:
        """Generate unique UPI transaction ID"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"CHILLIN{timestamp}{random_suffix}"
    
    def generate_reference_id(self) -> str:
        """Generate claim reference ID for tracking"""
        random_suffix = ''.join(random.choices(string.ascii_uppercase, k=4))
        return f"CL{datetime.utcnow().strftime('%Y%m%d')}{random_suffix}"
    
    async def process_payout(
        self,
        claim_id: str,
        rider_id: str,
        payout_amount: float,
        upi_id: str,
        verdict: str,
        trigger_type: str = "rain"
    ) -> Dict:
        """
        Process UPI payout for approved claim
        Simulates instant settlement
        """
        
        if payout_amount <= 0:
            return {
                "status": "rejected",
                "reason": "Zero or negative payout amount",
                "claim_id": claim_id
            }
        
        txn_id = self.generate_transaction_id()
        ref_id = self.generate_reference_id()
        timestamp = datetime.utcnow()
        
        # Simulate payout processing
        payout_record = {
            "transaction_id": txn_id,
            "reference_id": ref_id,
            "claim_id": claim_id,
            "rider_id": rider_id,
            "payout_amount": round(payout_amount, 2),
            "upi_id": upi_id,
            "verdict": verdict,
            "trigger_type": trigger_type,
            "timestamp": timestamp.isoformat(),
            "status": "SETTLED",
            "settlement_time_seconds": self.settlement_time_seconds,
            "processing_notes": f"Instant {verdict} payout for {trigger_type} disruption"
        }
        
        # Store in history
        self.payout_history[txn_id] = payout_record
        
        return {
            "status": "success",
            "message": f"✅ Payout processed successfully",
            "transaction": payout_record,
            "upi_confirmation": {
                "amount": f"₹{int(payout_amount)}",
                "recipient": upi_id,
                "txn_id": txn_id,
                "reference": ref_id,
                "timestamp": timestamp.isoformat(),
                "status": "SETTLED"
            },
            "estimated_arrival": {
                "settlement_time_seconds": self.settlement_time_seconds,
                "message": "💳 Funds will arrive instantly to your UPI account"
            }
        }
    
    def get_payout_history(self, rider_id: str, limit: int = 10) -> Dict:
        """Get payout history for a rider"""
        
        rider_payouts = [
            payout for payout in self.payout_history.values()
            if payout.get("rider_id") == rider_id
        ]
        
        # Sort by timestamp descending
        rider_payouts.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        total_payouts = sum(p.get("payout_amount", 0) for p in rider_payouts)
        
        return {
            "rider_id": rider_id,
            "total_payouts": len(rider_payouts),
            "total_amount_received": round(total_payouts, 2),
            "recent_payouts": rider_payouts[:limit],
            "average_payout": round(total_payouts / max(1, len(rider_payouts)), 2)
        }
    
    def get_payout_details(self, transaction_id: str) -> Dict:
        """Get details of a specific payout"""
        
        payout = self.payout_history.get(transaction_id)
        
        if not payout:
            return {
                "status": "not_found",
                "message": "Transaction not found"
            }
        
        return {
            "status": "found",
            "transaction": payout,
            "settlement_confirmed": True,
            "funds_available": True
        }
    
    async def process_batch_payouts(
        self,
        payouts: List[Dict]
    ) -> Dict:
        """Process multiple payouts in batch"""
        
        results = []
        total_amount = 0
        
        for payout in payouts:
            result = await self.process_payout(
                payout.get("claim_id"),
                payout.get("rider_id"),
                payout.get("payout_amount", 0),
                payout.get("upi_id"),
                payout.get("verdict", "PARTIAL"),
                payout.get("trigger_type", "rain")
            )
            
            results.append(result)
            if result.get("status") == "success":
                total_amount += payout.get("payout_amount", 0)
        
        successful = sum(1 for r in results if r.get("status") == "success")
        
        return {
            "batch_status": "completed",
            "total_requests": len(payouts),
            "successful_payouts": successful,
            "failed_payouts": len(payouts) - successful,
            "total_amount_processed": round(total_amount, 2),
            "results": results
        }
    
    def generate_payout_report(self) -> Dict:
        """Generate system-wide payout report"""
        
        all_payouts = list(self.payout_history.values())
        
        total_amount = sum(p.get("payout_amount", 0) for p in all_payouts)
        
        # Group by verdict
        verdicts = {}
        for p in all_payouts:
            verdict = p.get("verdict")
            verdicts[verdict] = verdicts.get(verdict, 0) + 1
        
        # Group by trigger
        triggers = {}
        for p in all_payouts:
            trigger = p.get("trigger_type")
            triggers[trigger] = triggers.get(trigger, 0) + 1
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "total_payouts_processed": len(all_payouts),
            "total_amount_disbursed": round(total_amount, 2),
            "average_payout": round(total_amount / max(1, len(all_payouts)), 2),
            "verdicts": verdicts,
            "triggers": triggers,
            "settlement_rate_percent": 100,  # All simulated as instant
            "unique_riders": len(set(p.get("rider_id") for p in all_payouts))
        }
    
    def simulate_upi_transfer_details(
        self,
        txn_id: str,
        payout_amount: float,
        rider_upi: str
    ) -> Dict:
        """Generate detailed UPI transfer simulation"""
        
        return {
            "txn_id": txn_id,
            "type": "NEFT",
            "amount": f"₹{int(payout_amount)}",
            "timestamp": datetime.utcnow().isoformat(),
            "from": {
                "bank": "ChillInsure Bank (Demo)",
                "account": "CHILLIN***789",
                "ifsc": "CHIL0000001"
            },
            "to": {
                "upi": rider_upi,
                "name": f"Rider Account"
            },
            "status": "SETTLED",
            "reference": f"CLAIM/{datetime.utcnow().strftime('%Y%m%d')}/{str(payout_amount).replace('.', '')}",
            "description": "Parametric Insurance Claim Settlement",
            "settlement_time": "0 seconds (Instant)",
            "fees": 0,
            "net_received": f"₹{int(payout_amount)}"
        }
