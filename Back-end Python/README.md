# Participant API

Minimal Flask API for the SmartConseil project.

## Setup on Windows

From this folder, create a virtual environment and install dependencies:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Run

```powershell
.\.venv\Scripts\python.exe -m flask --app app run --debug
```

The root endpoint is available at `http://127.0.0.1:5000/`.
