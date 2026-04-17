import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth_route import router as auth_router
from routes.gigscore_route import router as gigscore_router

app = FastAPI(
    title="ChillInsure API",
    version="1.0.0"
)
app.include_router(gigscore_router)
app.include_router(auth_router)
app.include_router(gigscore_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gigscore_router)


@app.get("/")
def root():
    return {"status": "ChillInsure backend running"}


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
