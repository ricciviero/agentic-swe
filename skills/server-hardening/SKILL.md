---
name: server-hardening
description: "Security hardening for a production Linux server and its stack: OS, SSH/access, network/firewall, Docker containers, reverse proxy/TLS, secrets/IAM, audit, and anti-OOM resource controls. Use for server security, attack-surface reduction, CIS Benchmark work, SSH hardening, firewall rules, IMDSv2, SSM instead of SSH, container security (`no-new-privileges`, `cap_drop`, `read_only`, resource limits), secret/key rotation, CloudTrail/audit, and RAM/CPU saturation prevention. Includes before-and-after snapshots, a prepare-validate-confirm-apply workflow, and scanners such as Lynis, docker-bench-security, OpenSCAP, and Trivy."
---

# Server Hardening

Harden a production Linux server and prove each change with verification output. This is an executable checklist, not a theory guide. For every action: snapshot before -> apply -> verify -> record evidence.

## Method

1. Capture before/after state: listening ports, firewall rules, service config, images, permissions.
2. Use **Prepare -> Validate -> Confirm -> Apply** for changes that can lock you out or affect production: SSH, firewall, SELinux enforcing, key rotation, and cloud network rules.
3. Run objective scanners before and after hardening: Lynis, OpenSCAP, docker-bench-security, Trivy.
4. Apply least privilege to every user, process, credential, and network path.
5. Use defense in depth: cloud firewall plus host firewall, security groups plus app config.
6. Prefer declarative, idempotent config over untracked ClickOps.

Priority levels: critical, recommended, optional.

## Network and Firewall

- Critical: inventory listening ports with `ss -tlnp` and the cloud/network firewall. Close anything not required.
- Critical: default-deny inbound; allow only required ports, usually 80/443 and restricted shell access.
- Recommended: enable a host firewall (`nftables`, `firewalld`, or `ufw`) in addition to the network firewall. Verify with `nft list ruleset` or `firewall-cmd --list-all`.
- Recommended: keep admin services such as databases, caches, and dashboards off the public internet. Verify `ss -tlnp` does not expose them on `0.0.0.0`.

## Shell Access and SSH

- Prefer access without an exposed SSH port when the platform supports it, such as AWS SSM Session Manager, IAP, or a managed bastion. Confirm the alternative access path works before closing port 22.
- If SSH remains open, require keys, disable password auth, and disable root login:

```text
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
KbdInteractiveAuthentication no
```

Verify with:

```bash
sshd -T | grep -Ei "passwordauthentication|permitrootlogin|pubkeyauthentication"
```

- Restrict SSH by trusted source IP where possible.
- Use fail2ban or crowdsec when SSH is exposed.
- Do not override the OS crypto policy for SSH unless there is a documented reason.

## OS, Updates, and Kernel

- Use a recognized baseline such as CIS Benchmark or SCAP Security Guide. Verify with OpenSCAP or Lynis.
- Enable automatic security updates (`dnf-automatic` or `unattended-upgrades`) and plan reboots for kernel updates.
- Enable SELinux enforcing or AppArmor after reviewing denial logs; do not flip enforcement blindly.
- Add sysctl hardening where absent: reverse path filtering, no source routing, no redirects, `kernel.kptr_restrict`, `kernel.dmesg_restrict`.
- Verify time sync with `chronyc tracking`.
- Disable unnecessary enabled services.

## Containers and Docker

- Critical: set memory and CPU limits for every container. Verify with `docker inspect <container> | grep -iE "Memory|NanoCpus"` and `docker stats`.
- Critical: use `security_opt: ["no-new-privileges:true"]`, `cap_drop: [ALL]`, and only minimal `cap_add`.
- Recommended: use rootless Docker or a non-root image user; add `read_only: true` and `tmpfs` for writable paths when feasible.
- Configure Docker log rotation in `/etc/docker/daemon.json`.
- Scan images with `trivy image <name>` and fail CI for high/critical issues where appropriate.
- Run `docker-bench-security` for the CIS Docker Benchmark and resolve relevant warnings.

## Reverse Proxy, Web, and TLS

- Use valid managed TLS certificates, such as Let's Encrypt or a cloud certificate manager. Verify with `curl -sI https://<host>`.
- Add security headers at the proxy: HSTS, `X-Content-Type-Options`, `X-Frame-Options` or CSP `frame-ancestors`, `Referrer-Policy`, and Content Security Policy. Start CSP in report-only when risk is high.
- Hide server version banners.
- Add rate limiting or a WAF where brute-force, scraping, or lightweight DoS is plausible.

## Secrets, IAM, and Credentials

- Avoid long-lived credentials when federation exists. Use OIDC for CI and SSO/Identity Center for humans.
- Enforce secure cloud metadata access, such as AWS IMDSv2 with `HttpTokens=required`.
- Keep secrets out of images and repositories. Use `600` permissions for env files, Docker secrets, `*_FILE` patterns, or a secret manager.
- Rotate without downtime: create new credential, update clients, disable old credential, verify, then delete.
- Use an application DB user with least privilege on the app schema only. Migration tools may need DDL on that schema.

## Observability and Audit

- Enable cloud control-plane audit trails, such as AWS CloudTrail.
- Log shell sessions when supported, such as SSM session logs or `auditd` for SSH.
- Enable `auditd` for local security events. Verify with `systemctl status auditd` and `auditctl -l`.
- Consider managed threat detection, such as GuardDuty, based on budget and risk.

## Resource Safety

- Set service/container limits so their sum leaves room for the OS.
- Use swap as a safety net, not as a RAM substitute. Verify with `free -h` and `swapon --show`.
- Consider `oom_score_adj` for critical processes such as databases.
- Add CPU, RAM, and disk alerts, then trigger a test threshold to verify notifications.

## Verification Tools

Run these on the real server before and after hardening:

| Tool | Covers | Command |
|---|---|---|
| Lynis | Linux OS config, permissions, services | `lynis audit system` |
| OpenSCAP | CIS/SCAP compliance | `oscap xccdf eval --profile <cis> ...` |
| docker-bench-security | CIS Docker | `./docker-bench-security.sh` |
| Trivy | Image CVEs and secrets | `trivy image <name>` |
| ss / nmap | Exposed ports | `ss -tlnp`; `nmap <host>` from outside |

## Anti-Patterns

- Closing SSH, enforcing SELinux, or rotating the only key before validating alternative access.
- Declaring a server secure without verification output.
- Running containers without resource limits on a shared host.
- Storing secrets in images, repos, or logged environment values.
- Relying on only one defensive layer.
- Enabling HSTS preload or restrictive CSP in production without a test phase.

## Expected Output

For every item handled, report status plus evidence: command output, file reference, or scanner result. An item without evidence is not done.
