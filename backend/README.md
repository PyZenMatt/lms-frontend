Minimal Django backend prepared for Render deployment.

Files of interest:
- `manage.py`, `Procfile`, `requirements.txt`, `config/`, `api/`, `.env.example`, `render.yaml`

Quickhowto: create a new git repo that contains only this `backend/` folder and push it to origin.

Example (from repository root):

1) Create a new repository locally that contains only the backend contents

```bash
mkdir ../lms-backend-repo
cd ../lms-backend-repo
git init
git remote add origin <your-new-remote-url>
git checkout -b main
rsync -av --exclude='.venv' --exclude='node_modules' --exclude='.git' ../schoolplatform/backend/ ./
git add .
git commit -m "Initial backend import"
git push -u origin main
```

2) On Render: create a new Web Service, set the "Root Directory" to `/` (this repo root contains `manage.py`), and use the `render.yaml` or manual UI with the build and start commands described in this repo.

3) Set environment variables from `.env.example` in Render (or let Render generate `SECRET_KEY`), and connect the Postgres database created via Render.

Smoke test locally (optional):

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DJANGO_SETTINGS_MODULE=config.settings.production
export SECRET_KEY=dev
export DATABASE_URL=sqlite:///db.sqlite3
python manage.py migrate --noinput
python manage.py collectstatic --noinput
gunicorn config.wsgi:application -b 0.0.0.0:8000
```

If you run into static files 404s, confirm `STATIC_ROOT` is writable and Whitenoise middleware is immediately after `SecurityMiddleware`.

Next: Once deployed, update the frontend's `VITE_API_BASE_URL` env var to point to the Render service URL and test `/api/health/` from the browser console.
