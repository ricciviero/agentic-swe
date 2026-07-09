# Observability

Add observability before production traffic.

## Minimum

- CloudWatch log groups with retention.
- Structured application logs.
- Metrics and alarms for CPU, memory, errors, latency, and saturation.
- ALB 5xx/4xx and target health alarms.
- Database CPU, connections, storage, and replica lag alarms where relevant.

## Tracing

Use AWS X-Ray or OpenTelemetry when request tracing is needed across services.

## Verification

- Trigger a test log and confirm it appears.
- Trigger or simulate an alarm threshold and confirm notification delivery.
- Dashboard shows the service health signals required for deploy decisions.
