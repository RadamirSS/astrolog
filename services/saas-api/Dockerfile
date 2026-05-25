FROM python:3.12-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends libpq5 \
  && rm -rf /var/lib/apt/lists/*

COPY services/backend-common /app/services/backend-common
COPY services/saas-api /app/services/saas-api
COPY scripts/deploy/docker-entrypoint-saas.sh /entrypoint.sh

RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
  && pip install --no-cache-dir -e /app/services/backend-common -e /app/services/saas-api \
  && chmod +x /entrypoint.sh

WORKDIR /app/services/saas-api

ENV PYTHONUNBUFFERED=1
ENV SERVICE_NAME=saas-api
ENV SAAS_API_PORT=8000

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
