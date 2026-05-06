# Zing Healthy Treats

## Description

Zing Healthy Treats is a modern e-commerce platform built with a decoupled architecture. 
It features a robust **Flask** RESTful API backend and a high-performance **Next.js** frontend styled with Tailwind CSS and Shadcn UI.

The platform includes:
- A customer-facing storefront built with Next.js (React 18, Tailwind CSS, framer-motion/AOS for animations).
- A server-side rendered administrative dashboard and API engine built with Flask.
- Secure JWT-based authentication connecting the frontend and backend.
- A seamless shopping cart and checkout experience.

## Tech Stack

**Frontend:**
![Next.js badge](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white&style=for-the-badge)
![React badge](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black&style=for-the-badge)
![Tailwind CSS badge](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white&style=for-the-badge)
![TypeScript badge](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge)

**Backend:**
![Python badge](https://img.shields.io/badge/PYTHON-3776ab?logo=python&logoColor=white&style=for-the-badge)
![Flask badge](https://img.shields.io/badge/FLASK-000000?logo=flask&logoColor=white&style=for-the-badge)
![SQLite badge](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white&style=for-the-badge)

## File Description

| **FILE / DIR**     | **DESCRIPTION**                                     |
| :----------------: | --------------------------------------------------- |
| `zing-frontend/`   | The Next.js frontend application.                   |
| `app/`             | Flask backend application package.                  |
| `static/`          | Static files (images) served by Flask.              |
| `templates/`       | Jinja2 HTML templates for the Admin Dashboard.      |
| `run.py`           | Entry point to start the Flask backend server.      |
| `requirements.txt` | Python dependencies required for the backend.       |

## Installation & Usage

Because the architecture is decoupled, you must run both the backend API server and the frontend Next.js server simultaneously.

### 1. Setup and Run the Flask Backend
1. Open a terminal in the root directory.
2. Activate the virtual environment:
```bash
source .venv/bin/activate
```
3. Start the backend server:
```bash
python run.py
```
> The backend API will be running at **http://127.0.0.1:5000**. The Admin Dashboard can be accessed here (e.g., `/login`).

### 2. Setup and Run the Next.js Frontend
1. Open a **new terminal tab** and navigate to the frontend directory:
```bash
cd zing-frontend
```
2. Start the Next.js development server:
```bash
npm run dev
```
> The customer storefront will be running at **http://localhost:3000**.

### Quick Start (Already Configured)
If you have already installed dependencies and initialized the database, you can simply:
- **Backend:** `source .venv/bin/activate && python run.py`
- **Frontend:** `cd zing-frontend && npm run dev`

### Usage
- **Customer Storefront**: Go to `http://localhost:3000` to browse products, register a user, add items to your cart, and checkout.
- **Admin Dashboard**: Go to `http://127.0.0.1:5000/login` and sign in with the admin credentials you created (`admin` / `demo`) to manage products and orders.
