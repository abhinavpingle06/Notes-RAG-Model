FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /main

COPY requirements.txt .

# Install matching CPU-only PyTorch packages
RUN pip install --no-cache-dir \
    --index-url https://download.pytorch.org/whl/cpu \
    torch==2.11.0 \
    torchvision==0.26.0

# Install application dependencies
RUN pip install --no-cache-dir \
    --index-url https://pypi.org/simple \
    -r requirements.txt

COPY main.py .
COPY server.py .
COPY env_secrets.py .
COPY app/ ./app/

EXPOSE 8000

CMD ["python", "server.py"]