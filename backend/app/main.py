from fastapi import FastAPI

app = FastAPI(title="SupportIQ API")


@app.get("/health")
def health():
    return {"status": "ok"}