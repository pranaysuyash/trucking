#!/usr/bin/env python3
"""Verify the review package's capture/source custody without product writes."""
import hashlib
import json
import runpy
import struct
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parents[2]


def verify():
    cases = json.loads((ROOT / "cases.json").read_text())
    captures = json.loads((ROOT / "captures/capture-results.json").read_text())
    index = json.loads((ROOT / "captures/artifact-index.json").read_text())
    revision = runpy.run_path(str(ROOT / "server.py"))["visual_revision"]()
    records = {record["id"]: record for record in captures["cases"]}
    artifacts = {record["id"]: record for record in index["artifacts"]}
    errors = []
    stale_captures = []
    ids = [case["id"] for case in cases]
    if len(ids) != 120 or len(set(ids)) != 120:
        errors.append("Expected 120 unique case IDs")
    if len(records) != 120 or len(artifacts) != 120:
        errors.append("Capture/index coverage differs from 120")
    groups = dict(Counter(case["product"] for case in cases))
    if len(groups) != 10 or any(count != 12 for count in groups.values()):
        errors.append("Expected ten groups of twelve")
    for case in cases:
        case_id = case["id"]
        if not (PROJECT / case["source"].split(":")[0]).exists():
            errors.append(f"Missing source: {case_id}")
        for name in [f"captures/{case_id}.png", f"thumbnails/{case_id}.png"]:
            if not (ROOT / name).is_file():
                errors.append(f"Missing artifact: {name}")
        record, artifact = records.get(case_id, {}), artifacts.get(case_id, {})
        if record.get("revision") != revision:
            stale_captures.append(case_id)
        if record.get("ready") != case_id or record.get("painted") != case_id or record.get("error"):
            errors.append(f"Render readiness/error: {case_id}")
        if record.get("review") != "AWAITING YOUR REVIEW":
            errors.append(f"Capture review state differs: {case_id}")
        if case.get("visual", {}).get("humanDecision") != "pending":
            errors.append(f"Baseline decision differs: {case_id}")
        image_path = ROOT / f"captures/{case_id}.png"
        if image_path.exists():
            data = image_path.read_bytes()
            if data[:8] != b"\x89PNG\r\n\x1a\n" or struct.unpack(">II", data[16:24]) != (1440, 1024):
                errors.append(f"Unexpected image dimensions/format: {case_id}")
            if hashlib.sha256(data).hexdigest() != artifact.get("sha256"):
                errors.append(f"Image hash mismatch: {case_id}")
    return {"checkedAt": datetime.now(timezone.utc).isoformat(), "revision": revision,
            "cases": len(cases), "groups": groups, "captures": len(records),
            "uniqueImageHashes": len({item["sha256"] for item in artifacts.values()}),
            "capturesAtCurrentRevision": len(cases)-len(stale_captures),
            "captureRevisionCounts": dict(Counter(record.get("revision") for record in records.values())),
            "allCapturesMatchCurrentRevision": not stale_captures,
            "capturesNeedingRefresh": stale_captures,
            "artifactIntegrityPass": not errors,
            "errors": errors, "pass": not errors and not stale_captures,
            "scope": "Local artifact/source integrity, Tier 2/S1. No human approval or product validity implied."}


if __name__ == "__main__":
    result = verify()
    (ROOT / "captures/package-checks.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result["pass"] else 1)
