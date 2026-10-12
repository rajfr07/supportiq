# Project Notes

## Team
- Raj: backend (FastAPI), branches named backend-...
- Priyasha: frontend (React), branches named frontend-...

## How to start the backend
1. Open a terminal in the backend folder
2. Activate the environment: .\.venv\Scripts\Activate.ps1
3. Start the server: uvicorn app.main:app --reload
4. Check http://127.0.0.1:8000/health and http://127.0.0.1:8000/docs

## Git routine
- Before working: git pull
- Work on your own branch: git checkout -b branch-name
- Save: git add . then git commit -m "message"
- Upload: git push -u origin branch-name
- Then create a pull request on GitHub and merge it

## Done so far
- Backend skeleton with /health endpoint (merged to main)