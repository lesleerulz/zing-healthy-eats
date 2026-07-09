from app.app import create_app
from app.models import db, User, Category
from werkzeug.datastructures import FileStorage
import io

app = create_app()
app.config['TESTING'] = True
app.config['WTF_CSRF_ENABLED'] = False
app.config['SUPABASE_SERVICE_KEY'] = 'test-key'  # to avoid RuntimeError in test

with app.test_client() as client:
    with app.app_context():
        # Create an admin user if not exists
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(username='admin', email='admin@test.com', is_admin=True)
            admin.set_password('password')
            db.session.add(admin)
            db.session.commit()
            
        category = Category.query.first()
        cat_id = category.id if category else 1

        # Simulate login by modifying session
        with client.session_transaction() as sess:
            sess['_user_id'] = str(admin.id)
            sess['_fresh'] = True

    # Prepare form data
    data = {
        'title': 'Test Product',
        'description': 'Test Description',
        'price': '9.99',
        'original_price': '',
        'quantity': '10',
        'category_id': str(cat_id),
        'image': (io.BytesIO(b"abcdef"), 'test.jpg')
    }

    response = client.post('/dashboard/add-product', data=data, content_type='multipart/form-data', follow_redirects=True)
    if response.status_code == 500:
        print("HTTP 500 Error encountered!")
        print(response.data.decode('utf-8'))
    else:
        print(f"Success! Status Code: {response.status_code}")
