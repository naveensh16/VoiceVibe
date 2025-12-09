# run.py
from voicevibe import create_app
import logging

# Configure logging to show all messages
logging.basicConfig(
    level=logging.INFO,
    format='[%(name)s] %(levelname)s: %(message)s'
)

app = create_app()

if __name__ == "__main__":
    # set debug=False in production
    app.run(host="0.0.0.0", port=8000, debug=False)
