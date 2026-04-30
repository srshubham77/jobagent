FROM python:3.12-slim
WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY src/ src/

# Install Playwright browsers
RUN uv run playwright install chromium --with-deps

EXPOSE 8084
CMD ["uv", "run", "uvicorn", "apply.main:app", "--host", "0.0.0.0", "--port", "8084"]
