from app.app import create_app
from app.models import db, FAQ

app = create_app()

def seed_faqs():
    with app.app_context():
        # Clear existing FAQs to avoid duplicates if needed, 
        # but the user said "add some", so I'll just check if they exist or just add new ones.
        
        faqs_data = [
            {
                "question": "Where is your pickup station located?",
                "answer": "Our main pickup station is located in Nairobi CBD, specifically at the Zing Hub, and is open Monday to Saturday from 8:00 AM to 6:00 PM."
            },
            {
                "question": "How do I pay for my order?",
                "answer": "We accept M-Pesa (via STK Push or hosted checkout) and major Credit/Debit cards through our secure payment partner, Paystack. All payments are encrypted and secure."
            },
            {
                "question": "Is your food strictly organic?",
                "answer": "We prioritize sourcing fresh, organic ingredients from local Kenyan farmers to ensure the highest nutritional value and taste in every healthy meal we prepare."
            },
            {
                "question": "Can I cancel my order?",
                "answer": "Orders can be canceled within 30 minutes of placement for a full refund. Since our meals are prepared fresh, we cannot offer refunds once the kitchen has started preparation."
            },
            {
                "question": "Do you offer home delivery?",
                "answer": "Currently, we operate on a pickup-only model from our Nairobi CBD station. This helps us ensure your meal reaches you as fresh as possible. Stay tuned for delivery options coming soon!"
            },
            {
                "question": "How do I know when my order is ready?",
                "answer": "You will receive an email notification and an SMS once your order is ready for collection at our station. You can also track your status in the 'Orders' section of your profile."
            }
        ]

        for faq_item in faqs_data:
            # Check if FAQ already exists
            existing = FAQ.query.filter_by(question=faq_item["question"]).first()
            if not existing:
                new_faq = FAQ(question=faq_item["question"], answer=faq_item["answer"])
                db.session.add(new_faq)
        
        db.session.commit()
        print("FAQs seeded successfully!")

if __name__ == "__main__":
    seed_faqs()
