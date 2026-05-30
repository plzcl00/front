# E-Diary front

React + Vite SPA for the emotion-diary moodboard API.

## Local development

1. Start the API (`emotion-diary-server`) on port 8080 with CORS allowing `http://localhost:5173`.
2. Copy `.env.example` to `.env` and set `VITE_API_URL=http://localhost:8080`.
3. Run `npm install` and `npm run dev`.

## Two-container deployment

The browser calls the API using a **public** URL (not a Docker internal hostname).

| Variable | Where | Example |
|----------|--------|---------|
| `VITE_API_URL` | Front image build arg | `http://localhost:8080` |
| `APP_CORS_ALLOWED_ORIGINS` | API container env | `http://localhost` |

Build the front image:

```bash
docker build --build-arg VITE_API_URL=http://localhost:8080 -t ediary-front .
docker run -p 80:80 ediary-front
```

Set the API container `APP_CORS_ALLOWED_ORIGINS` to the exact origin users use to open the SPA (scheme + host + port).
