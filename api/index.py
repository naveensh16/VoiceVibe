# api/index.py - Vercel serverless function entrypoint
from voicevibe import create_app

app = create_app()

# Vercel expects the app to be named 'app'
# This is the WSGI application callable
