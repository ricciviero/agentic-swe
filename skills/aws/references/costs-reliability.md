# Cost and Reliability

## Cost Controls

- Create AWS Budgets and alerts.
- Tag resources by project, environment, and owner.
- Right-size compute after observing metrics.
- Use Savings Plans or Reserved Instances only after usage is stable.
- Delete idle NAT Gateways, unattached EBS volumes, old snapshots, and unused load balancers.

## Reliability

- Use Multi-AZ for production databases.
- Run production compute across at least two AZs.
- Configure health checks and autoscaling.
- Test backups and restores.
- Define RTO and RPO before choosing DR architecture.

## Verification

- Budget alerts reach the correct channel.
- Autoscaling policy has a measurable trigger.
- Restore test succeeded within the intended RTO/RPO.
- Rollback path is documented and tested.
