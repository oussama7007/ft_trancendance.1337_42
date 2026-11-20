# Monitoring with Prometheus and Grafana

**Module:** DevOps, "Monitoring system with Prometheus and Grafana" (Major, 2 pts)

## What it does

Grafana shows the health of the project on one page: whether the backend and the database are up, how many requests each route receives, how long they take, and how much memory and CPU are in use. Prometheus collects those numbers every 15 seconds and raises an alert when something goes wrong.

## How to run it

1. Add these two lines to `backend/.env`:
   ```
   GF_SECURITY_ADMIN_USER=admin
   GF_SECURITY_ADMIN_PASSWORD=a_strong_password
   ```
   Grafana reads them itself: every setting of Grafana can be given as a variable that starts with `GF_`.
2. Start everything: `docker compose up --build -V`
   (`-V` is needed once, because the backend has a new dependency.)
3. Open http://localhost:3001, sign in, and open the **iRent overview** dashboard.

Prometheus itself is at http://localhost:9090 (targets and alerts). It only answers on the machine that runs Docker.

## How each point of the subject is done

| The subject asks for | Where it is |
|---|---|
| Set up Prometheus to collect metrics | `monitoring/prometheus/prometheus.yml` reads three sources every 15 seconds |
| Configure exporters and integrations | `postgres-exporter` for the database, `node-exporter` for the host, and the backend's own `GET /metrics` (`backend/src/metrics/`) |
| Create custom Grafana dashboards | `monitoring/grafana/dashboards/irent-overview.json`, loaded automatically at start |
| Set up alerting rules | `monitoring/prometheus/alerts.yml`: backend down, database down, high error rate, slow requests, host memory almost full |
| Secure access to Grafana | sign-in required, the password comes from `backend/.env`, no anonymous access and no self sign-up |

## How the pieces talk

```
backend  GET /metrics ─┐
postgres-exporter ─────┼──> Prometheus (stores numbers, checks alerts) ──> Grafana (draws them)
node-exporter ─────────┘
```

- **Backend:** a middleware times every request and counts it by method, route and status. `GET /metrics` returns the totals as text.
- **Exporters:** small programs that translate the numbers of PostgreSQL and of the host into the same text format.
- **Prometheus:** asks each source for its numbers, keeps their history, and evaluates the alert rules.
- **Grafana:** asks Prometheus and draws the dashboard. The data source and the dashboard are files in the repository, so every machine gets the same result.

## Why these choices

- **prom-client** is the standard Prometheus library for Node.js, and it is the only new dependency.
- **Route patterns as labels** (`/listings/:id`, not `/listings/42`) keep the number of series small. Requests that match no route are grouped under `unknown`.
- **Alert rules live in Prometheus**, so they keep working even if Grafana is stopped. Grafana lists them and the dashboard shows the ones that are firing.

## Known limits

- `GET /metrics` on the backend has no sign-in. It exposes counters and memory figures, no user data.
- Grafana is served over plain HTTP on port 3001. It should move behind the team's HTTPS proxy when that exists.
- Alerts are shown in Prometheus and Grafana but are not sent anywhere (no email or chat notification).
