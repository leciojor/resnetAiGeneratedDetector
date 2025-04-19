FROM python:3.11-slim

WORKDIR /src

COPY ./backend/requirements.txt .

RUN apt-get update && apt-get install -y libgl1
RUN apt-get update && apt-get install -y libglib2.0-0
RUN pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

COPY ./backend/ ./

RUN mkdir -p /app/models

ENV model_path ./model_lr=0.001-adam(decay=1e-06)-step=20-steps=1600-batchSize=32-7.pkl
ENV model_url https://drive.google.com/uc?id=1-GEURv1FM6fS0WEJcl-WQ2acy9Y6yIsy
EXPOSE 5000

CMD ["python", "endpoints.py"]