FROM python:3.11-slim
WORKDIR /app
COPY . /app
RUN apt-get update && apt-get install -y ffmpeg build-essential git && rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
ENV FLASK_APP=run.py
EXPOSE 5000
CMD ["python","run.py"]
