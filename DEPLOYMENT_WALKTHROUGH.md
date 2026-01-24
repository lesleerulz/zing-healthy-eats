# 🚀 Deployment Guide: Truehost cPanel (Flask)

This guide will walk you through deploying your **Zing Healthy Treats** (Flask) application to Truehost using cPanel's "Setup Python App" tool.

---

## ✅ Phase 1: Prepare Your Project

1.  **Verify `requirements.txt`**:
    *   Ensure all libraries are listed. The agent has just updated this file for you.
2.  **Verify `passenger_wsgi.py`**:
    *   This file is the "Entry Point" for cPanel servers. It has been created in your project root.
3.  **Zip Your Project**:
    *   Select all files in your project folder **EXCEPT** the `venv` folder, `.git` folder, and `__pycache__` folders.
    *   Right-click -> **Send to** -> **Compressed (zipped) folder**.
    *   Name it `project.zip`.

---

## ☁️ Phase 2: Upload to cPanel

1.  **Log in to cPanel**: Go to your Truehost client area and log in to cPanel.
2.  **File Manager**:
    *   Open **File Manager**.
    *   Navigate to the root directory (usually `/home/yourusername/`).
    *   Create a new folder called `myshop` (or any name you prefer, but simpler is better).
    *   **Open** that folder.
    *   Click **Upload** in the top bar.
    *   Select and upload your `project.zip`.
    *   Once uploaded, right-click `project.zip` -> **Extract**.
    *   **Important**: Ensure `passenger_wsgi.py` and `requirements.txt` are now visible in this folder.

---

## 🐍 Phase 3: Setup Python App

1.  **Find the Tool**:
    *   Go back to the cPanel main dashboard.
    *   Search for **"Setup Python App"** (under Software).
2.  **Create Application**:
    *   Click **Create Application**.
    *   **Python Version**: Select the latest available (e.g., 3.9, 3.10, or 3.11). *Note: Ensure it matches roughly what you developed on, typically 3.x is fine.*
    *   **Application Root**: Enter the folder name you created (e.g., `myshop`).
    *   **Application URL**: Select your domain (e.g., `zinghealthytreats.com`). Leave the field blank to host on the root domain, or type `shop` to host at `zinghealthytreats.com/shop`.
    *   **Application Startup File**: Enter `passenger_wsgi.py`.
    *   **Application Entry Point**: Enter `application` (this matches the variable inside `passenger_wsgi.py`).
    *   Click **Create**.

---

## 📦 Phase 4: Install Dependencies

1.  **Enter Virtual Environment**:
    *   At the top of the "Setup Python App" page for your new app, you will see a "Command for entering virtual environment". It looks like:
        `source /home/user/virtualenv/myshop/3.9/bin/activate && cd /home/user/myshop`
    *   **Click the copy icon** next to it.
2.  **Open Terminal**:
    *   Go back to cPanel main dashboard.
    *   Search for **"Terminal"**.
    *   Open it.
    *   **Paste** the command you copied and hit Enter. You are now inside your app's virtual environment.
3.  **Install Libraries**:
    *   Run this command:
        ```bash
        pip install -r requirements.txt
        ```
    *   Wait for it to finish successfully.

---

## 🗄️ Phase 5: Database Setup (MySQL)

*While SQLite works, MySQL is recommended for production on cPanel.*

1.  **Create Database**:
    *   Go to cPanel -> **MySQL® Database Wizard**.
    *   Step 1: Create a database (e.g., `uptown_zingdb`).
    *   Step 2: Create a user (e.g., `uptown_zinguser`) and password. **Save these!**
    *   Step 3: Assign user to database -> Check **ALL PRIVILEGES**.
2.  **Configure Environment Variables**:
    *   Go back to **Setup Python App**.
    *   Click the **Edit** (pencil) icon next to your app.
    *   Scroll down to **Configuration Environment Variables**.
    *   Add the following variables:
        *   `DATABASE_URL`: `mysql+pymysql://username:password@localhost/databasename`
            *(Replace `username`, `password`, and `databasename` with the ones you just created. Keep `localhost`)*
        *   `FLASK_APP`: `passenger_wsgi.py`
        *   `FLASK_ENV`: `production`
        *   `SECRET_KEY`: (Generate a random string and paste it here)
        *   `GOOGLE_CLIENT_ID`: (Your Google Client ID)
        *   `GOOGLE_CLIENT_SECRET`: (Your Google Client Secret)
    *   Click **Save**.

---

## 🚀 Phase 6: Launch
1.  **Update Google Cloud Console**:
    *   **Crucial Step**: Go back to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
    *   Edit your OAuth Client.
    *   Under **Authorized redirect URIs**, add your **production** URL:
        *   `https://your-domain.com/login/google/callback`
        *   (Replace `your-domain.com` with your actual domain name).
    *   Save changes.

2.  **Restart App**:
    *   In the "Setup Python App" dashboard, click the **Restart** button.
2.  **Initialize Database tables**:
    *   Go back to **Terminal**.
    *   Ensure you are in the virtual environment (run the source command again if needed).
    *   Run the Python shell: `python`
    *   Run these commands to create tables:
        ```python
        from app.app import db, create_app
        app = create_app()
        with app.app_context():
            db.create_all()
            print("Tables created!")
        exit()
        ```
3.  **Visit Your URL**:
    *   Go to your website. You should see the Zing Healthy Treats homepage!

---

## 🛠️ Troubleshooting

*   **"Internal Server Error"**: Check `stderr.log` in your project folder (`myshop`) via File Manager. It usually means a missing library or syntax error.
*   **Images not Loading**: Ensure the `static` folder is correctly served. cPanel serves static files automatically, but sometimes you may need to ask support to "map static files" if they 404.
*   **Database Errors**: Double-check your `DATABASE_URL` format. It must be `mysql+pymysql://...`.
