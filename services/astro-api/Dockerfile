FROM python:3.12-slim

WORKDIR /app

COPY services/backend-common /app/services/backend-common
COPY services/astro-api /app/services/astro-api

RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
  && pip install --no-cache-dir -e /app/services/backend-common -e /app/services/astro-api

WORKDIR /app/services/astro-api

ENV PYTHONUNBUFFERED=1
ENV SERVICE_NAME=astro-api
ENV ASTRO_API_PORT=8100

EXPOSE 8100

CMD ["uvicorn", "astro_api.main:app", "--host", "0.0.0.0", "--port", "8100"]
