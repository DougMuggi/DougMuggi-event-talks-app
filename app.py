import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

import requests
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
ATOM_NS = "http://www.w3.org/2005/Atom"


def _strip_html(html: str) -> str:
    """Return plain-text preview of an HTML snippet (first 280 chars)."""
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:280] + ("…" if len(text) > 280 else "")


def _tag(name: str) -> str:
    return f"{{{ATOM_NS}}}{name}"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/releases")
def releases():
    try:
        resp = requests.get(FEED_URL, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as exc:
        return jsonify({"error": str(exc)}), 502

    try:
        root = ET.fromstring(resp.content)
    except ET.ParseError as exc:
        return jsonify({"error": f"XML parse error: {exc}"}), 500

    feed_updated_el = root.find(_tag("updated"))
    feed_updated = feed_updated_el.text if feed_updated_el is not None else None

    entries = []
    for entry in root.findall(_tag("entry")):
        title_el = entry.find(_tag("title"))
        updated_el = entry.find(_tag("updated"))
        link_el = entry.find(_tag("link"))
        content_el = entry.find(_tag("content"))
        id_el = entry.find(_tag("id"))

        title = title_el.text if title_el is not None else "Untitled"
        updated = updated_el.text if updated_el is not None else ""
        link = link_el.attrib.get("href", "#") if link_el is not None else "#"
        raw_html = content_el.text if content_el is not None else ""
        entry_id = id_el.text if id_el is not None else ""

        # Extract the fragment anchor from the entry id
        anchor = entry_id.split("#")[-1] if "#" in entry_id else ""

        entries.append(
            {
                "title": title,
                "updated": updated,
                "link": link,
                "anchor": anchor,
                "html": raw_html,
                "preview": _strip_html(raw_html),
            }
        )

    return jsonify(
        {
            "feed_updated": feed_updated,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "count": len(entries),
            "entries": entries,
        }
    )


if __name__ == "__main__":
    app.run(debug=True, port=5000)
