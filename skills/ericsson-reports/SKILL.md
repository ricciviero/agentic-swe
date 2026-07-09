---
name: ericsson-reports
description: Build, modify, debug, or extend automated Ericsson KPI reporting pipelines that create Excel, PowerPoint, or HTML outputs from structured data. Use for Ericsson reports, KPI or CSR reporting, monthly reporting automation, or Python reporting pipelines using pandas, openpyxl, python-pptx, matplotlib, or Chart.js in an Ericsson context.
---

# Ericsson Report Pipeline

Build maintainable Python reporting pipelines for Ericsson KPI and CSR reporting. Keep customer data, templates, credentials, and generated reports out of the skill itself.

## Required Architecture

Use focused modules with one responsibility each:

```text
project/
  data/                    Source Excel, CSV, or equivalent inputs
  templates/               Approved Excel and PowerPoint templates
  output/YYYY_MM/          Generated output for a reporting period
  scripts/                 Entry points and test runners
  src/
    config.py              Constants, mappings, cell coordinates
    data_loader.py         Input parsing and normalization
    kpi_calculator.py      Business calculation source of truth
    excel_report.py        Excel output
    pptx_report.py         Template-based PowerPoint output
    pptx_redesign.py       Native PowerPoint redesign output
    html_report.py         HTML dashboard output
  tests/                   pytest coverage
```

Keep business calculations out of output modules, and keep presentation logic out of `kpi_calculator.py`.

## Dependencies

Use the smallest required set, typically:

```text
pandas>=2.0.0
openpyxl>=3.1.0
python-pptx>=0.6.21
matplotlib>=3.7.0
pytest>=8.0.0
```

## Development Order

1. Centralize report constants, source mappings, coordinates, and approved palette values in `config.py`.
2. Normalize source data in `data_loader.py`; do not calculate KPI business rules there.
3. Implement all KPI logic as explicit, tested public methods in `KPICalculator`.
4. Make Excel, PowerPoint, and HTML renderers consume only calculator outputs.
5. Add regression coverage for every corrected KPI defect.

Document non-obvious source-field mapping rules in code, including the source field, condition, customer filter, and reporting period.

## Output Rules

- Preserve approved templates and their formatting when using template-based reports.
- Keep redesigned PowerPoint layouts separate from template-based rendering.
- Keep HTML dashboards self-contained when required and make responsive and print behavior intentional.
- Format SLA percentages consistently, including decimal precision required by the report contract.
- Do not let output modules call each other or access raw DataFrames.

## Cross-Method Invariants

Before release, test that totals agree across reporting methods: severity totals, registered and answered counts, subdomain totals, overdue details, year-to-date calculations, and executive summaries. Every invariant must use the same reporting period and customer filters as the source KPI method.

## Delivery Rule

Inspect the target report templates, source schemas, and existing calculation tests before implementing report-specific behavior. Keep report data, customer mappings, templates, and generated outputs in the target project rather than this public skill.
