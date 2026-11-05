#!/usr/bin/env python3
"""Loopback-only review gallery, using the already installed Three.js runtime."""
import argparse
import json
import hashlib
import mimetypes
import os
import math
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent
THREE = ROOT.parents[2] / "products/product-04-asset-studio/node_modules/three"
CASE_IDS = {case["id"] for case in json.loads((ROOT / "cases.json").read_text())}
DECISIONS = ROOT / "review-decisions.jsonl"


def validate_review_context(case_id, value):
    if not isinstance(value, dict) or set(value) != {"version", "mode", "phase", "explode", "fixture", "presentation"}:
        raise ValueError("Reload the study to save its reviewed fixture and scene state.")
    if type(value["version"]) is not int or value["version"] != 2 or not isinstance(value["mode"], str) or value["mode"] not in {"dimensions", "volume", "mass"}:
        raise ValueError("Unknown review context version or layer.")
    def number(v):
        return type(v) in {int, float} and math.isfinite(v)
    if not all(number(value[k]) and 0 <= value[k] <= 1 for k in ["phase", "explode"]):
        raise ValueError("Invalid reviewed sequence or separation.")
    presentation = value["presentation"]
    if not isinstance(presentation, dict) or set(presentation) != {"quality", "annotations"} or not isinstance(presentation["quality"], str) or presentation["quality"] not in {"studio", "simple"} or type(presentation["annotations"]) is not bool:
        raise ValueError("Invalid reviewed presentation state.")
    fixture = value["fixture"]
    if case_id in {"CF-02", "AS-05"}:
        keys = {"lengthM", "widthM", "heightM", "massLb", "wheelbaseM"}
        if not isinstance(fixture, dict) or set(fixture) != keys or not all(
            number(fixture[k]) and 0 <= fixture[k] <= 1e6 and (k == "massLb" or fixture[k] > 0) for k in keys
        ):
            raise ValueError("Invalid reviewed fixture values.")
    elif fixture is not None:
        raise ValueError("This study has no editable fixture context.")
    return value


def visual_revision():
    digest = hashlib.sha256()
    for name in ["cases.json", "review.html", "gallery/main.mjs", "gallery/scenes.mjs", "gallery/style.css", "gallery/responsive.mjs",
                 "gallery/fixture-editing.mjs", "gallery/review-state.mjs", "gallery/presentation.mjs", "gallery/scene-craft.mjs", "gallery/selection.mjs", "gallery/camera-fit.mjs", "gallery/scene-kernel.mjs", "gallery/annotations.mjs",
                 "references/responsive/desktop.png", "references/responsive/tablet.png", "references/responsive/mobile.png"]:
        digest.update(name.encode())
        digest.update((ROOT / name).read_bytes())
    return digest.hexdigest()[:16]


class ReviewHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    def log_message(self, fmt, *args):
        if args and str(args[0]).startswith("POST"):
            super().log_message(fmt, *args)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def translate_path(self, path):
        clean = unquote(urlsplit(path).path)
        if clean.startswith("/vendor/three/"):
            rel = clean.removeprefix("/vendor/three/")
            if rel.startswith("addons/"):
                rel = "examples/jsm/" + rel.removeprefix("addons/")
            base = THREE
        else:
            rel = clean.lstrip("/") or "review.html"
            base = ROOT
        candidate = (base / rel).resolve()
        if not candidate.is_relative_to(base.resolve()):
            return str(ROOT / "__not_found__")
        if candidate.suffix in {".py", ".jsonl"}:
            return str(ROOT / "__not_found__")
        return str(candidate)

    def do_GET(self):
        if urlsplit(self.path).path == "/api/revision":
            self.reply(200, {"revision": visual_revision()})
            return
        if urlsplit(self.path).path == "/api/decisions":
            latest = {}
            if DECISIONS.exists():
                for line in DECISIONS.read_text().splitlines():
                    try:
                        entry = json.loads(line)
                        latest[entry["caseId"]] = entry
                    except (json.JSONDecodeError, KeyError):
                        continue
            self.reply(200, latest)
            return
        super().do_GET()

    def do_POST(self):
        if self.path != "/api/decisions":
            self.reply(404, {"error": "Unknown endpoint"})
            return
        expected = f"http://127.0.0.1:{self.server.server_port}"
        if self.headers.get("Origin") != expected or self.headers.get_content_type() != "application/json":
            self.reply(403, {"error": "Use the local review page to save a decision."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length < 10000:
                raise ValueError("Invalid review size")
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError("A review must be a JSON object.")
            if not isinstance(data.get("caseId"), str) or data["caseId"] not in CASE_IDS or not isinstance(data.get("decision"), str) or data["decision"] not in {"approved", "revise", "deferred"}:
                raise ValueError("Choose a study and a visual decision")
            if data.get("revision") != visual_revision():
                self.reply(409, {"error": "The visual has changed. Reload and review this revision before saving."})
                return
            if not isinstance(data.get("note", ""), str) or len(data.get("note", "")) > 4000:
                raise ValueError("Review note is too long")
            context = validate_review_context(data["caseId"], data.get("reviewContext"))
            entry = {"caseId": data["caseId"], "decision": data["decision"], "note": data.get("note", ""),
                     "actor": "Pranay", "scope": "visual study only", "revision": data["revision"],
                     "reviewContext": context,
                     "savedAt": datetime.now(timezone.utc).isoformat()}
            with DECISIONS.open("a") as handle:
                handle.write(json.dumps(entry) + "\n")
            self.reply(200, entry)
        except (ValueError, json.JSONDecodeError) as error:
            self.reply(400, {"error": str(error)})

    def reply(self, status, data):
        payload = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


class ReviewServer(ThreadingHTTPServer):
    # The post-processing module graph arrives in a burst on a cold browser.
    request_queue_size = 64
    daemon_threads = True


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=5195)
    options = parser.parse_args()
    mimetypes.add_type("text/javascript", ".mjs")
    if not (THREE / "build/three.module.js").is_file():
        raise SystemExit(f"Existing Three.js runtime is unavailable: {THREE}")
    server = ReviewServer(("127.0.0.1", options.port), ReviewHandler)
    print(f"Spatial review: http://127.0.0.1:{options.port}/review.html", flush=True)
    server.serve_forever()
