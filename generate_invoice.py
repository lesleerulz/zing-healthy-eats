import os
from flask import render_template
from app.app import create_app
from app.models import Order, User
# You may need to install weasyprint: pip install weasyprint
try:
    from weasyprint import HTML
except ImportError:
    HTML = None

def generate_invoice_pdf(order_id, output_path="invoice.pdf"):
    """
    Generate a PDF invoice for a given order using the existing HTML template.
    Requires: pip install weasyprint
    """
    app = create_app()
    with app.app_context():
        order = Order.query.get(order_id)
        if not order:
            print(f"Order {order_id} not found.")
            return False
            
        user = User.query.get(order.user_id)
        
        # Render the existing email invoice template to an HTML string
        rendered_html = render_template(
            "email/invoice.html",
            order=order,
            user=user,
            support_phone=app.config.get("SUPPORT_PHONE", "+254 723 729 852")
        )
        
        if HTML is None:
            print("Error: WeasyPrint is not installed.")
            print("Run: pip install weasyprint")
            
            # Fallback: Save as HTML file if PDF generation is not available
            fallback_path = output_path.replace('.pdf', '.html')
            with open(fallback_path, "w", encoding="utf-8") as f:
                f.write(rendered_html)
            print(f"Saved HTML fallback to {fallback_path}")
            return False

        # Generate PDF using WeasyPrint
        HTML(string=rendered_html).write_pdf(output_path)
        print(f"Successfully generated PDF invoice: {output_path}")
        return True

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        order_id = int(sys.argv[1])
        generate_invoice_pdf(order_id, f"invoice_order_{order_id}.pdf")
    else:
        print("Usage: python generate_invoice.py <order_id>")
