#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ID="${PROJECT_ID:-gtm-agents-deepset}"
REGION="${REGION:-europe-west3}"
REPO="${REPO:-finance-movements}"
SERVICE="${SERVICE:-finance-movements}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"

APP_TEST_PORT="${APP_TEST_PORT:-18082}"
DOCKER_TEST_PORT="${DOCKER_TEST_PORT:-18083}"

IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:${IMAGE_TAG}"
LOCAL_IMAGE="${SERVICE}:localtest"
CONTAINER_NAME="${SERVICE}-docker-test"

log() {
  printf "\n[%s] %s\n" "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

fail() {
  printf "\nERROR: %s\n" "$*" >&2
  exit 1
}

cleanup_port() {
  local port="$1"
  local pids
  pids="$(lsof -t -i :"${port}" 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    log "Releasing port ${port}"
    kill ${pids} 2>/dev/null || true
  fi
}

cleanup() {
  set +e
  if [[ -n "${APP_PID:-}" ]]; then
    if kill -0 "${APP_PID}" >/dev/null 2>&1; then
      log "Stopping local app (PID ${APP_PID})"
      kill "${APP_PID}" >/dev/null 2>&1 || true
      wait "${APP_PID}" 2>/dev/null || true
    fi
  fi
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  cleanup_port "${APP_TEST_PORT}"
  cleanup_port "${DOCKER_TEST_PORT}"
}
trap cleanup EXIT

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

wait_for_http() {
  local url="$1"
  local max_attempts="${2:-30}"
  local sleep_seconds="${3:-2}"
  for ((i=1; i<=max_attempts; i++)); do
    if curl -fsS "$url" >/dev/null 2>&1; then return 0; fi
    log "Waiting for ${url} (${i}/${max_attempts})"
    sleep "${sleep_seconds}"
  done
  return 1
}

require_cmd npm
require_cmd curl
require_cmd docker
require_cmd gcloud
require_cmd lsof

[[ -n "${PROJECT_ID}" ]] || fail "PROJECT_ID is required"

log "Configuration"
echo "  PROJECT_ID=${PROJECT_ID}"
echo "  REGION=${REGION}"
echo "  REPO=${REPO}"
echo "  SERVICE=${SERVICE}"
echo "  IMAGE_TAG=${IMAGE_TAG}"
echo "  IMAGE_URI=${IMAGE_URI}"

log "Ensuring test ports are free"
cleanup_port "${APP_TEST_PORT}"
cleanup_port "${DOCKER_TEST_PORT}"

log "Installing dependencies"
npm install

log "Building app"
npm run build

log "Starting local app on ${APP_TEST_PORT}"
PORT="${APP_TEST_PORT}" npm start > .local-app.log 2>&1 &
APP_PID=$!

if ! wait_for_http "http://127.0.0.1:${APP_TEST_PORT}/api/health" 30 2; then
  echo
  echo "===== .local-app.log ====="
  cat .local-app.log || true
  fail "Local app health check failed"
fi

log "Local app health check"
curl -fsS "http://127.0.0.1:${APP_TEST_PORT}/api/health"
echo

log "Building local Docker image"
docker build --platform linux/amd64 -t "${LOCAL_IMAGE}" .

log "Starting Docker container on host port ${DOCKER_TEST_PORT}"
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p "${DOCKER_TEST_PORT}:8080" \
  "${LOCAL_IMAGE}" >/dev/null

if ! wait_for_http "http://127.0.0.1:${DOCKER_TEST_PORT}/api/health" 30 2; then
  echo
  echo "===== docker logs ${CONTAINER_NAME} ====="
  docker logs "${CONTAINER_NAME}" || true
  fail "Docker container health check failed"
fi

log "Docker container health check"
curl -fsS "http://127.0.0.1:${DOCKER_TEST_PORT}/api/health"
echo

log "Configuring Docker auth for Artifact Registry"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

log "Building and pushing registry image"
docker buildx build \
  --platform linux/amd64 \
  -t "${IMAGE_URI}" \
  --push \
  .

log "Success"
echo "Pushed image: ${IMAGE_URI}"
