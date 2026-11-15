import glob, json, re, sys, zipfile, io, os

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads/DATA NASA")
OUT = os.path.join(os.path.dirname(__file__), "..", "lib", "psi-metadata.json")
ID_MAP = {"BASS": "BASS", "BASS-II": "BASS-II", "FLEX": "FLEX", "FLEX-2": "FLEX-2", "SAFFIRE-I": "SAFFIRE-I", "SAFFIRE-II": "SAFFIRE-II", "SAME": "SAME", "SAME-R": "SAME-R", "SAFFIRE-III": "SAFFIRE-III", "SLICE": "SLICE", "SPICE": "SPICE", "CFI": "CFI", "ACME BRE": "ACME-BRE", "ACME E-FIELD FLAMES": "ACME-EFIELD", "ACME S-FLAME": "ACME-SFLAME", "DAFT / DAFT-2": "DAFT"}


def rows(text):
    out, buf = {}, ""
    for line in text.splitlines():
        buf = f"{buf}\n{line}" if buf and buf.count('"') % 2 else line
        if buf.count('"') % 2:
            continue
        key, _, rest = buf.partition("\t")
        out.setdefault(key.strip(), [c.strip().strip('"').strip() for c in rest.split("\t")])
        buf = ""
    return out


def first(r, key):
    v = [x for x in r.get(key, []) if x]
    return v[0] if v else ""


def parse(text):
    r = rows(text)
    acr = first(r, "Comment[Investigation Acronym]")
    titles = r.get("Study Publication Title", [])
    links = r.get("Comment[Study Publication Link]", [])
    years = r.get("Study Publication Author List", [])
    pubs = [{"title": t, "link": links[i] if i < len(links) else ""} for i, t in enumerate(titles) if t]
    return {
        "psiId": first(r, "Study Identifier"),
        "acronym": acr,
        "appId": ID_MAP.get(acr.upper(), "BASS" if "BASS" in first(r, "Study Title") else None),
        "title": first(r, "Study Title"),
        "ground": not acr,
        "doi": first(r, "Comment[DOI]"),
        "hardware": first(r, "Comment[Experiment Hardware]"),
        "platform": first(r, "Comment[Flight Platform]"),
        "start": first(r, "Comment[Investigation Start Date]"),
        "end": first(r, "Comment[Investigation End Date]"),
        "objective": first(r, "Comment[Objective]"),
        "hypothesis": first(r, "Comment[Hypothesis]"),
        "approach": first(r, "Comment[Approach]"),
        "impacts": first(r, "Comment[Research Impacts]"),
        "keywords": [k for k in r.get("Study Design Type", []) if k],
        "people": [f"{f} {l}".strip() for f, l in zip(r.get("Study Person First Name", []), r.get("Study Person Last Name", [])) if l],
        "publications": pubs,
        "nAuthorsLists": len([y for y in years if y]),
    }


records = []
for z in sorted(glob.glob(os.path.join(SRC, "PSI-*.zip"))):
    with zipfile.ZipFile(z) as zf:
        name = next((n for n in zf.namelist() if n.endswith("i_Investigation.txt")), None)
        if name:
            records.append(parse(zf.read(name).decode("utf-8", "replace")))

json.dump(records, open(OUT, "w"), ensure_ascii=False, indent=1)
for r in records:
    print(f"{r['psiId']:8} {r['acronym'] or '-':11} -> {r['appId']}  pubs={len(r['publications'])} doi={r['doi']}")
assert records and all(r["appId"] for r in records), "every record must map to an app investigation"
