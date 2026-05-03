import re
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

ECI_HOME_URL = "https://results.eci.gov.in/"
TN_STATE_CODE = "22"
TN_RESULTS_FOLDER = "ResultAcGenMay2026"
REQUEST_TIMEOUT_SECONDS = 20
CACHE_TTL_SECONDS = 60

_live_cache = {
    "timestamp": 0,
    "payload": None,
}


def clean(x):
    try:
        return float(x)
    except Exception:
        return 0


def new_tax(income):
    income -= 50000
    if income <= 300000:
        return 0
    elif income <= 600000:
        return (income - 300000) * 0.05
    elif income <= 900000:
        return 15000 + (income - 600000) * 0.1
    elif income <= 1200000:
        return 45000 + (income - 900000) * 0.15
    elif income <= 1500000:
        return 90000 + (income - 1200000) * 0.2
    else:
        return 150000 + (income - 1500000) * 0.3


def old_tax(income):
    if income <= 250000:
        return 0
    elif income <= 500000:
        return (income - 250000) * 0.05
    elif income <= 1000000:
        return 12500 + (income - 500000) * 0.2
    else:
        return 112500 + (income - 1000000) * 0.3


def collapse_whitespace(value):
    return re.sub(r"\s+", " ", value or "").strip()


def normalize_key(value):
    return re.sub(r"[^a-z0-9]", "", (value or "").lower())


def parse_int(value):
    digits = re.sub(r"[^\d-]", "", str(value or ""))
    if digits in {"", "-"}:
        return 0
    return int(digits)


class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tables = []
        self._current_table = None
        self._current_row = None
        self._current_cell = None

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self._current_table = []
        elif tag == "tr" and self._current_table is not None:
            self._current_row = []
        elif tag in {"td", "th"} and self._current_row is not None:
            self._current_cell = []
        elif tag == "br" and self._current_cell is not None:
            self._current_cell.append(" ")

    def handle_data(self, data):
        if self._current_cell is not None:
            self._current_cell.append(data)

    def handle_endtag(self, tag):
        if tag in {"td", "th"} and self._current_cell is not None:
            text = collapse_whitespace("".join(self._current_cell))
            self._current_row.append(text)
            self._current_cell = None
        elif tag == "tr" and self._current_row is not None:
            if any(cell for cell in self._current_row):
                self._current_table.append(self._current_row)
            self._current_row = None
        elif tag == "table" and self._current_table is not None:
            if self._current_table:
                self.tables.append(self._current_table)
            self._current_table = None


def extract_tables(html):
    parser = TableParser()
    parser.feed(html)
    return parser.tables


def strip_tags(html):
    text = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.IGNORECASE)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    return collapse_whitespace(text)


def fetch_html(url):
    request_obj = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept-Language": "en-IN,en;q=0.9",
        },
    )

    try:
        with urlopen(request_obj, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            return response.read().decode("utf-8", errors="ignore")
    except HTTPError as exc:
        raise RuntimeError(f"HTTP {exc.code} for {url}") from exc
    except URLError as exc:
        raise RuntimeError(f"Network error for {url}: {exc.reason}") from exc


def fetch_first_available(urls):
    last_error = None
    for url in urls:
        try:
            return fetch_html(url)
        except RuntimeError as exc:
            last_error = exc
    raise last_error or RuntimeError("No fetch URL provided")


def find_table_header(table, required_keys):
    for row_index, row in enumerate(table):
        normalized_row = [normalize_key(cell) for cell in row]
        if all(any(required in cell for cell in normalized_row) for required in required_keys):
            return row_index, normalized_row
    return None, None


def parse_party_summary(html):
    required_headers = ["party", "won", "leading", "total"]

    for table in extract_tables(html):
        header_index, normalized_row = find_table_header(table, required_headers)
        if header_index is None:
            continue

        header_lookup = {}
        for index, cell in enumerate(normalized_row):
            if "party" in cell:
                header_lookup["party"] = index
            elif "won" in cell:
                header_lookup["won"] = index
            elif "leading" in cell:
                header_lookup["leading"] = index
            elif "total" in cell:
                header_lookup["total"] = index

        if len(header_lookup) < 4:
            continue

        rows = []
        for row in table[header_index + 1 :]:
            if len(row) <= max(header_lookup.values()):
                continue

            party_name = collapse_whitespace(row[header_lookup["party"]])
            if not party_name or party_name.lower() == "total":
                continue

            rows.append(
                {
                    "party": party_name,
                    "won": parse_int(row[header_lookup["won"]]),
                    "leading": parse_int(row[header_lookup["leading"]]),
                    "total": parse_int(row[header_lookup["total"]]),
                }
            )

        if rows:
            return rows

    return []


def parse_constituency_rows(html):
    required_headers = [
        "constituency",
        "constno",
        "leadingcandidate",
        "leadingparty",
        "trailingcandidate",
        "trailingparty",
        "margin",
        "round",
        "status",
    ]

    for table in extract_tables(html):
        header_index, normalized_row = find_table_header(table, required_headers)
        if header_index is None:
            continue

        header_lookup = {}
        for index, cell in enumerate(normalized_row):
            if "constituency" in cell:
                header_lookup["constituency"] = index
            elif "constno" in cell:
                header_lookup["const_no"] = index
            elif "leadingcandidate" in cell:
                header_lookup["leading_candidate"] = index
            elif "leadingparty" in cell:
                header_lookup["leading_party"] = index
            elif "trailingcandidate" in cell:
                header_lookup["trailing_candidate"] = index
            elif "trailingparty" in cell:
                header_lookup["trailing_party"] = index
            elif "margin" in cell:
                header_lookup["margin"] = index
            elif cell == "round":
                header_lookup["round"] = index
            elif "status" in cell:
                header_lookup["status"] = index

        if len(header_lookup) < 9:
            continue

        rows = []
        for row in table[header_index + 1 :]:
            if len(row) <= max(header_lookup.values()):
                continue

            constituency = collapse_whitespace(row[header_lookup["constituency"]])
            if not constituency:
                continue

            rows.append(
                {
                    "constituency": constituency,
                    "constNo": parse_int(row[header_lookup["const_no"]]),
                    "leadingCandidate": collapse_whitespace(
                        row[header_lookup["leading_candidate"]]
                    ),
                    "leadingParty": collapse_whitespace(
                        row[header_lookup["leading_party"]]
                    ),
                    "trailingCandidate": collapse_whitespace(
                        row[header_lookup["trailing_candidate"]]
                    ),
                    "trailingParty": collapse_whitespace(
                        row[header_lookup["trailing_party"]]
                    ),
                    "margin": parse_int(row[header_lookup["margin"]]),
                    "round": collapse_whitespace(row[header_lookup["round"]]),
                    "status": collapse_whitespace(row[header_lookup["status"]]),
                }
            )

        if rows:
            return rows

    return []


def build_scheduled_payload(home_html):
    home_text = strip_tags(home_html)
    schedule_match = re.search(
        r"Results trends will start from\s+(.+?)(?:Download ECINET App|$)",
        home_text,
        flags=re.IGNORECASE,
    )
    message = (
        schedule_match.group(1).strip()
        if schedule_match
        else "Official ECI trends are not live yet."
    )

    return {
        "status": "scheduled",
        "source": "Election Commission of India",
        "officialUrl": ECI_HOME_URL,
        "message": message,
        "checkedAt": datetime.now(timezone.utc).isoformat(),
    }


def fetch_tn_official_results(force=False):
    now = time.time()
    if (
        not force
        and _live_cache["payload"] is not None
        and now - _live_cache["timestamp"] < CACHE_TTL_SECONDS
    ):
        return _live_cache["payload"]

    home_html = fetch_html(ECI_HOME_URL)
    scheduled_payload = build_scheduled_payload(home_html)

    party_urls = [
        f"https://results.eci.gov.in/{TN_RESULTS_FOLDER}/partywiseresult-S{TN_STATE_CODE}.htm?st=S{TN_STATE_CODE}",
        f"https://results.eci.gov.in/{TN_RESULTS_FOLDER}/partywiseresult-S{TN_STATE_CODE}.htm",
    ]

    try:
        party_html = fetch_first_available(party_urls)
    except RuntimeError:
        _live_cache["timestamp"] = now
        _live_cache["payload"] = scheduled_payload
        return scheduled_payload

    party_summary = parse_party_summary(party_html)
    if not party_summary:
        _live_cache["timestamp"] = now
        _live_cache["payload"] = scheduled_payload
        return scheduled_payload

    constituencies = []
    for page in range(1, 25):
        page_urls = [
            f"https://results.eci.gov.in/{TN_RESULTS_FOLDER}/statewiseS{TN_STATE_CODE}{page}.htm",
            f"https://results.eci.gov.in/{TN_RESULTS_FOLDER}/statewiseS{TN_STATE_CODE}{page}.htm?st=S{TN_STATE_CODE}",
        ]

        try:
            page_html = fetch_first_available(page_urls)
        except RuntimeError:
            if page == 1:
                break
            break

        page_rows = parse_constituency_rows(page_html)
        if not page_rows:
            break

        constituencies.extend(page_rows)

    payload = {
        "status": "live" if constituencies else "partial",
        "source": "Election Commission of India",
        "officialUrl": ECI_HOME_URL,
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "partySummary": party_summary,
        "constituencies": constituencies,
    }

    _live_cache["timestamp"] = now
    _live_cache["payload"] = payload
    return payload


@app.route("/")
def home():
    return "Backend running"


@app.route("/calculate", methods=["POST"])
def calculate():
    data = request.get_json() or {}

    ctc = clean(data.get("ctc"))
    bonus = clean(data.get("bonus"))
    pf = clean(data.get("pf"))
    pt = clean(data.get("pt"))

    total = ctc + bonus

    tax_new = new_tax(total)
    tax_old = old_tax(total)

    monthly = ctc / 12

    return jsonify(
        {
            "tax_new": tax_new,
            "tax_old": tax_old,
            "inhand_new": monthly - tax_new / 12 - pf - pt,
            "inhand_old": monthly - tax_old / 12 - pf - pt,
        }
    )


@app.route("/api/tn-election-live", methods=["GET"])
def tn_election_live():
    force_refresh = request.args.get("refresh") == "1"

    try:
        payload = fetch_tn_official_results(force=force_refresh)
        status_code = 200 if payload["status"] in {"live", "partial"} else 503
        return jsonify(payload), status_code
    except Exception as exc:
        return (
            jsonify(
                {
                    "status": "error",
                    "source": "Election Commission of India",
                    "officialUrl": ECI_HOME_URL,
                    "message": str(exc),
                    "checkedAt": datetime.now(timezone.utc).isoformat(),
                }
            ),
            502,
        )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
