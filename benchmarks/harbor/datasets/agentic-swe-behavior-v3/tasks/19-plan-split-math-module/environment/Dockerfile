FROM oven/bun:1.3.6-debian@sha256:ef3b811897fedf7985166930302b867ebaefdff927fe705bdbe2fc6ca149367e
USER root
RUN apt-get update && apt-get install -y --no-install-recommends git python3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace
COPY fixture/ /workspace/
RUN git init -q && git config user.email benchmark@example.invalid && git config user.name BehaviorBench && git add . && git commit -qm fixture
