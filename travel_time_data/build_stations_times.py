import glob
import csv
import xml.etree.ElementTree as ET
import re
from collections import defaultdict

OUTPUT_CSV = "tfl_station_travel_times.csv"

# ---------- Helpers ----------

RUNTIME_RE_M = re.compile(r"(\d+)M")
RUNTIME_RE_S = re.compile(r"(\d+)S")

def parse_runtime(rt: str) -> int:
    if not rt:
        return 0
    m = RUNTIME_RE_M.search(rt)
    s = RUNTIME_RE_S.search(rt)
    minutes = int(m.group(1)) if m else 0
    seconds = int(s.group(1)) if s else 0
    return minutes * 60 + seconds

def platform_to_station_id(platform_id: str) -> str:
    if not platform_id.startswith("9400ZZ"):
        return ""
    
    body = platform_id[4:]

    if body.startswith("ZZLU") and re.search(r"\d$", body):
        body = body[:-1]

    return "940G" + body

LINE_FROM_FILENAME_RE = re.compile(r"tfl_\d+-([A-Z0-9]+)-", re.IGNORECASE)

def line_code_from_filename(filename: str) -> str:
    m = LINE_FROM_FILENAME_RE.search(filename.replace("\\", "/").split("/")[-1])
    return m.group(1).upper() if m else "UNK"

def first_nonempty(*vals):
    for v in vals:
        if v is not None:
            v = v.strip()
            if v:
                return v
    return ""

# ---------- Main extraction ----------

def build_platform_and_station_names(xml_files):
    platform_station = {}
    station_name = {}

    for file in xml_files:
        tree = ET.parse(file)
        root = tree.getroot()

        for stop in root.findall(".//{*}StopPoint"):
            platform_id = stop.findtext("{*}AtcoCode")
            if not platform_id:
                continue

            if not platform_id.startswith("9400ZZ"):
                continue

            sid = platform_to_station_id(platform_id)
            platform_station[platform_id] = sid

            common = stop.findtext("{*}Descriptor/{*}CommonName")
            notes = stop.findtext("{*}Notes")
            name = first_nonempty(common, notes)

            if sid not in station_name and name:
                station_name[sid] = name

    return platform_station, station_name

def extract_edges(xml_files, platform_station):
    edges = {}

    for file in xml_files:
        line = line_code_from_filename(file)

        tree = ET.parse(file)
        root = tree.getroot()

        for link in root.findall(".//{*}JourneyPatternTimingLink"):
            from_p = link.findtext(".//{*}From/{*}StopPointRef")
            to_p   = link.findtext(".//{*}To/{*}StopPointRef")
            rt     = link.findtext("{*}RunTime")

            if not from_p or not to_p or not rt:
                continue
            if from_p not in platform_station or to_p not in platform_station:
                continue

            from_s = platform_station[from_p]
            to_s   = platform_station[to_p]
            runtime = parse_runtime(rt)

            if runtime <= 0:
                continue

            key = (from_s, to_s, line)
            prev = edges.get(key)
            edges[key] = runtime if prev is None else min(prev, runtime)

    return edges

def main():
    xml_files = sorted(glob.glob("tfl_*.xml"))
    print(f"Found {len(xml_files)} XML files")

    platform_station, station_name = build_platform_and_station_names(xml_files)
    print(f"Mapped {len(platform_station)} platform IDs")
    print(f"Mapped {len(station_name)} station names")

    edges = extract_edges(xml_files, platform_station)
    print(f"Extracted {len(edges)} unique station-to-station edges")

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "from_station_id",
            "from_station_name",
            "to_station_id",
            "to_station_name",
            "line",
            "travel_time_seconds",
        ])

        for (from_s, to_s, line), time in sorted(edges.items()):
            writer.writerow([
                from_s,
                station_name.get(from_s, ""),
                to_s,
                station_name.get(to_s, ""),
                line,
                time
            ])

    print(f"CSV written to {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
