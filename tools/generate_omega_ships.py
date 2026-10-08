#!/usr/bin/env python3
"""Regenerate assets/omega-ships.js from the EVE Static Data Export (SDE).

The chart must mark every ship that cannot be flown by an Alpha clone. Doing
that from skill requirements at runtime would mean shipping the whole SDE with
the page, so the classification is done here, once, and the result is baked
into a small list of node ids that the app simply reads.

A ship needs Omega when at least one of its required skills is missing from the
Alpha skill set, or is required above the level an Alpha clone may train.

Inputs:
  * an unzipped SDE directory containing types.yaml, typeDogma.yaml,
    groups.yaml and categories.yaml
    (https://developers.eveonline.com/static-data/eve-online-static-data-latest-yaml.zip)
  * tools/alpha_skills.json - the Alpha skill set with per-skill level caps,
    taken from the EVE University "Clone states" article
  * README.md - the Mermaid flowchart that defines the chart's ships

Usage:
  python3 tools/generate_omega_ships.py /path/to/unzipped-sde
"""

import json
import os
import re
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALPHA_SKILLS = os.path.join(ROOT, "tools", "alpha_skills.json")
README = os.path.join(ROOT, "README.md")
OUT = os.path.join(ROOT, "assets", "omega-ships.js")

# Ships whose names in the chart do not match the SDE name exactly.
ALIASES = {
    "Exeqor Navy Issue": "Exequror Navy Issue",
}

# Special Edition ships (Jovian Directorate, limited rewards, ...) are not part
# of the normal SDE type list, so they are classified by hand. Every one of
# them requires a skill outside the Alpha set.
SPECIAL_EDITION_OMEGA = {
    "Phantom",
    "Eidolon",
    "Medusa",
    "Herald",
    "Visitant",
    "Penitence",
    "Ixion",
}

# Dogma attributes holding a ship's required skills and their levels.
REQUIRED_SKILL = (182, 183, 184, 1285, 1289, 1290)
REQUIRED_LEVEL = (277, 278, 279, 1286, 1287, 1288)


def en(value):
    """English name of an SDE localised field."""
    if isinstance(value, dict):
        return value.get("en")
    return value


def load_sde(sde_dir):
    with open(os.path.join(sde_dir, "types.yaml"), encoding="utf-8") as fh:
        types = yaml.safe_load(fh)
    with open(os.path.join(sde_dir, "typeDogma.yaml"), encoding="utf-8") as fh:
        type_dogma = yaml.safe_load(fh)
    with open(os.path.join(sde_dir, "groups.yaml"), encoding="utf-8") as fh:
        groups = yaml.safe_load(fh)
    with open(os.path.join(sde_dir, "categories.yaml"), encoding="utf-8") as fh:
        categories = yaml.safe_load(fh)
    return types, type_dogma, groups, categories


def alpha_type_ids(types, groups, categories, alpha):
    """Map each Alpha skill name to its typeID, then to its level cap."""
    skill_category = next(
        cid for cid, c in categories.items() if en(c.get("name")) == "Skill"
    )
    skill_groups = {
        gid for gid, g in groups.items() if g.get("categoryID") == skill_category
    }
    by_name = {}
    for tid, t in types.items():
        if t.get("groupID") in skill_groups:
            name = en(t.get("name"))
            if name:
                by_name.setdefault(name, tid)
    missing = [name for name in alpha if name not in by_name]
    if missing:
        raise SystemExit("Alpha skills missing from the SDE: " + ", ".join(missing))
    return {by_name[name]: cap for name, cap in alpha.items()}


def ship_requires_omega(type_dogma, type_id, alpha_ids):
    """Why the ship needs Omega, or an empty list when an Alpha can fly it."""
    attrs = {
        a["attributeID"]: a["value"]
        for a in (type_dogma.get(type_id) or {}).get("dogmaAttributes") or []
    }
    reasons = []
    for skill_attr, level_attr in zip(REQUIRED_SKILL, REQUIRED_LEVEL):
        skill_id = int(attrs.get(skill_attr, 0))
        if not skill_id:
            continue
        level = int(attrs.get(level_attr, 1))
        if skill_id not in alpha_ids:
            reasons.append(("skill", skill_id, level))
        elif level > alpha_ids[skill_id]:
            reasons.append(("level", skill_id, level, alpha_ids[skill_id]))
    return reasons


def chart_nodes():
    """[(node_id, label)] in the order they appear in the Mermaid block."""
    with open(README, encoding="utf-8") as fh:
        code = fh.read()
    block = re.search(r"```mermaid[ \t]*\r?\n([\s\S]*?)```", code)
    if not block:
        raise SystemExit("no ```mermaid block found in README.md")
    return re.findall(
        r'^\s*(n_[A-Za-z0-9_]+)\["([^"]+)"\]', block.group(1), flags=re.M
    )


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: generate_omega_ships.py /path/to/unzipped-sde")
    sde_dir = sys.argv[1]

    with open(ALPHA_SKILLS, encoding="utf-8") as fh:
        alpha = json.load(fh)

    types, type_dogma, groups, categories = load_sde(sde_dir)

    ship_category = next(
        cid for cid, c in categories.items() if en(c.get("name")) == "Ship"
    )
    ship_groups = {
        gid for gid, g in groups.items() if g.get("categoryID") == ship_category
    }

    alpha_ids = alpha_type_ids(types, groups, categories, alpha)

    omega_by_name = {}
    for tid, t in types.items():
        if t.get("groupID") not in ship_groups or not t.get("published"):
            continue
        name = en(t.get("name"))
        if name:
            omega_by_name[name] = bool(
                ship_requires_omega(type_dogma, tid, alpha_ids)
            )

    omega_ids = []
    unknown = []
    for node_id, label in chart_nodes():
        sde_name = ALIASES.get(label, label)
        if label in SPECIAL_EDITION_OMEGA:
            omega_ids.append(node_id)
        elif sde_name in omega_by_name:
            if omega_by_name[sde_name]:
                omega_ids.append(node_id)
        else:
            unknown.append(label)

    if unknown:
        print("warning: ships not found in the SDE:", ", ".join(unknown))

    header = (
        "/* Generated by tools/generate_omega_ships.py - do not edit by hand.\n"
        "   Ships that require an Omega clone: their node ids from the Mermaid\n"
        "   source in README.md. Classified offline from the EVE SDE and the\n"
        "   Alpha skill set, so nothing is computed in the browser. */\n"
    )
    items = ",\n  ".join('"%s"' % node_id for node_id in omega_ids)
    body = "window.OMEGA_SHIP_IDS = [\n  " + items + "\n];\n"
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(header + body)
    print("wrote %s (%d Omega ships)" % (OUT, len(omega_ids)))


if __name__ == "__main__":
    main()
