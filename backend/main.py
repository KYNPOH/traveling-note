from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # ReactのURLを許可
    allow_credentials=True,
    allow_methods=["*"],  # すべてのHTTPメソッドを許可
    allow_headers=["*"],  # すべてのヘッダーを許可
)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

@app.get("/notes")
def get_notes():
    return [
        {"id": 1, "content": "今日もいい天気だった！"},
        {"id": 2, "content": "仕事が忙しかった…"}
    ]
