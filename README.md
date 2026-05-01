# Smartshop

A full-stack AI-powered e-commerce web application with personalised product recommendations, wishlist, order management, and flash sales.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, Flask, Gunicorn |
| Frontend | React 19, Vite |
| Database | SQLite |
| Recommender | Collaborative filtering (`recommender.py`) |
| Deployment | Render |

## Features

- User authentication (register / login / logout)
- Product search with interaction tracking
- Personalised recommendations based on browsing history
- Trending & top-rated product feeds
- Wishlist management
- Cart & checkout with dummy payment simulation
- Order history
- Flash sales banner
- Email notifications (Gmail SMTP)
- PWA support (service worker + manifest)

## Project Structure

```
├── app.py               # Flask application & API routes
├── database.py          # DB initialisation & helpers
├── recommender.py       # Recommendation engine
├── load_dataset.py      # Load Amazon dataset into DB
├── requirements.txt     # Python dependencies
├── render.yaml          # Render deployment config
├── Procfile             # Gunicorn start command
├── data/
│   └── amazon.csv       # Product dataset
└── frontend/            # React + Vite SPA
    ├── src/
    │   ├── App.jsx
    │   ├── api.js
    │   └── components/
    └── public/
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend

```bash
pip install -r requirements.txt
python load_dataset.py   # populate the database
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies API calls to `http://localhost:5000`.

### Production Build

```bash
cd frontend && npm run build && cd ..
gunicorn app:app
```

## Deployment (Render)

This project includes a `render.yaml` for one-click deployment to [Render](https://render.com).

1. Push to GitHub
2. Connect the repo in Render
3. Render will auto-build and deploy using the config in `render.yaml`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Flask session secret key |
| `GMAIL_ADDRESS` | Sender email for notifications |
| `GMAIL_APP_PASSWORD` | Gmail App Password |

## Live Demo

**[https://smartshop-nhfk.onrender.com](https://smartshop-nhfk.onrender.com)**

> Note: Hosted on Render free tier — first load may take ~50 seconds to wake up.

## License

MIT
