from app.app import create_app
from app.models import db, SiteSetting

app = create_app()

def enable_black_friday():
    with app.app_context():
        # Toggle Sale Page On
        s_enabled = SiteSetting.query.filter_by(key='sale_page_enabled').first()
        if s_enabled:
            s_enabled.value = 'true'
        else:
            db.session.add(SiteSetting(key='sale_page_enabled', value='true'))
        
        # Set Title to Black Friday
        s_title = SiteSetting.query.filter_by(key='sale_page_title').first()
        if s_title:
            s_title.value = 'Black Friday'
        else:
            db.session.add(SiteSetting(key='sale_page_title', value='Black Friday'))
            
        db.session.commit()
        print("Successfully enabled Black Friday sale.")

if __name__ == "__main__":
    enable_black_friday()
