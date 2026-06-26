# BigQuery Release Notes Viewer

> A sleek, dark-themed web application that fetches live **Google BigQuery release notes** and lets you browse, search, filter — and tweet about them.

![Python](https://img.shields.io/badge/Python-3.8%2B-3776AB?style=flat-square&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=flat-square&logo=flask&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Features

- 🔄 **Live feed** — fetches directly from Google Cloud's official Atom XML feed
- 🃏 **Expandable cards** — click any release note to read the full content inline
- 🏷️ **Type badges** — colour-coded labels: Feature, Fix, Change, Deprecation, Security, Announcement
- 🔍 **Real-time search** — filter across all titles and content instantly
- 🎛️ **Filter pills** — one-click filter by release note type
- 🐦 **Tweet this** — compose and share any release note on X (Twitter) with a pre-filled, editable tweet
- ⏳ **Skeleton loader & spinner** — smooth loading states on every refresh
- 📱 **Responsive** — works across desktop and mobile screens

---

## 🗂️ Project Structure

```
bq-releases-notes/
├── app.py              # Flask backend — fetches & parses the Atom XML feed
├── requirements.txt    # Python dependencies (flask, requests)
├── .gitignore
├── templates/
│   └── index.html      # HTML shell served by Flask
└── static/
    ├── style.css       # Dark glassmorphism design system
    └── app.js          # Vanilla JS — fetch, filter, search, tweet modal
```

---

## 🏗️ Architecture

```
Browser (Client)  ←── HTTP JSON ───  Flask (Server)  ←── HTTPS XML ───  Google Cloud
  index.html                          app.py                              bigquery-release-notes.xml
  style.css
  app.js
```

**Why proxy through Flask?**  
Google's Atom feed does not include `Access-Control-Allow-Origin` headers. A direct browser fetch would be blocked by CORS policy. Flask fetches the feed server-side (where CORS doesn't apply) and re-serves it as clean JSON.

---

## ⚙️ Prerequisites

- **Python 3.8+**
- **pip**

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/DougMuggi/DougMuggi-event-talks-app.git
cd DougMuggi-event-talks-app
```

### 2. Create and activate a virtual environment (recommended)

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the app

```bash
python app.py
```

### 5. Open in your browser

```
http://127.0.0.1:5000
```

---

## 🔌 API Reference

The server exposes one data endpoint:

### `GET /api/releases`

Fetches the BigQuery Atom feed, parses it, and returns JSON.

**Response shape:**

```json
{
  "feed_updated": "2026-06-25T00:00:00-07:00",
  "fetched_at":   "2026-06-26T07:25:00+00:00",
  "count": 47,
  "entries": [
    {
      "title":   "June 25, 2026",
      "updated": "2026-06-25T00:00:00-07:00",
      "link":    "https://docs.cloud.google.com/bigquery/docs/release-notes#June_25_2026",
      "anchor":  "June_25_2026",
      "html":    "<h3>Feature</h3><p>...</p>",
      "preview": "Feature You can now use VECTOR_SEARCH to combine..."
    }
  ]
}
```

**Error responses:**

| Status | Meaning |
|--------|---------|
| `502`  | Could not reach Google's feed (network error) |
| `500`  | Feed was reachable but the XML could not be parsed |

---

## 🐦 Tweeting a Release Note

1. Click any card to expand it
2. Click **"Tweet this"** at the bottom of the card
3. A modal appears pre-filled with a ≤280-character tweet including:
   - Release type (e.g. `[Feature]`)
   - Date
   - A plain-text preview
   - The direct docs link
   - `#BigQuery #GoogleCloud` hashtags
4. Edit the text if needed, then click **"Post Tweet"**
5. Twitter's compose window opens in a popup — your credentials never touch this server

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Python · Flask · `xml.etree.ElementTree` · `requests` |
| Template | Jinja2 (via Flask) |
| Styling | Vanilla CSS · Glassmorphism · Google Fonts (Inter, JetBrains Mono) |
| Logic | Vanilla JavaScript (ES6+, IIFE pattern) |
| Data source | [Google Cloud BigQuery Atom feed](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml) |

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- Release notes data provided by [Google Cloud](https://cloud.google.com/bigquery/docs/release-notes)
- Typography: [Inter](https://fonts.google.com/specimen/Inter) & [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) via Google Fonts
