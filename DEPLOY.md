# Deploy TN Election Dashboard

This repo is set up for:

- `frontend` on Vercel
- `backend` on Render

## 1. Deploy the backend on Render

1. Push this repo to GitHub.
2. In Render, create a new `Web Service`.
3. Connect your GitHub repo.
4. Render will detect [render.yaml](/abs/path/c:/Users/harin/OneDrive/Documents/salary-insights/render.yaml:1).
5. Deploy the service.

Backend settings used:

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn server:app`

After deploy, copy the public backend URL. It will look like:

```text
https://tn-election-dashboard-api.onrender.com
```

You can test it with:

```text
https://tn-election-dashboard-api.onrender.com/api/tn-election-live
```

## 2. Deploy the frontend on Vercel

1. In Vercel, create a new project from the same GitHub repo.
2. Set the `Root Directory` to `frontend`.
3. Framework preset: `Vite`
4. Add this environment variable:

```text
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

5. Deploy.

The frontend already reads `VITE_API_BASE_URL` from [frontend/src/App.jsx](/abs/path/c:/Users/harin/OneDrive/Documents/salary-insights/frontend/src/App.jsx:18).

## 3. Share the app

Share the Vercel URL with anyone who should view it.

It will look like:

```text
https://your-project-name.vercel.app
```

## Notes

- If the Render free instance sleeps, the first request may take a little longer.
- Until the official ECI Tamil Nadu feed is live, the dashboard will still fall back to simulated numbers.
- Once the official ECI feed is available, the backend endpoint will provide official source status and constituency data to the frontend.
