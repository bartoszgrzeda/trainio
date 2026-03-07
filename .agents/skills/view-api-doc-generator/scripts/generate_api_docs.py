#!/usr/bin/env python3
"""Generate docs/api.md from *.view.md specifications.

The script scans all view files, extracts frontmatter + API table + Data Model JSON,
merges endpoints by METHOD + endpoint path, and updates the generated section in
`docs/api.md`.
"""

from __future__ import annotations

import argparse
import copy
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

GENERATED_SECTION_MARKER = "<!-- GENERATED SECTION -->"
GENERATED_SECTION_START = "<!-- GENERATED SECTION START -->"
GENERATED_SECTION_END = "<!-- GENERATED SECTION END -->"

DOCUMENT_HEADER = """# API Documentation

This document is generated from view specifications (`*.view.md`).

Each endpoint listed here is automatically extracted from the application view definitions."""

METHOD_PRIORITY = {
    "GET": 0,
    "POST": 1,
    "PUT": 2,
    "PATCH": 3,
    "DELETE": 4,
    "OPTIONS": 5,
    "HEAD": 6,
}

MISSING = object()


@dataclass(frozen=True)
class ViewRef:
    view_id: str
    route: str
    name: str
    title: str


@dataclass
class ParamDoc:
    name: str
    param_type: str
    required: bool
    description: str
    example: Any


@dataclass
class EndpointRecord:
    method: str
    path: str
    endpoint_template: str
    summary: str
    view: ViewRef
    path_params: dict[str, ParamDoc]
    query_params: dict[str, ParamDoc]
    request_example: Any
    response_example: Any
    request_raw: str
    response_raw: str
    notes: list[str] = field(default_factory=list)


@dataclass
class EndpointDoc:
    method: str
    path: str
    summaries: list[str] = field(default_factory=list)
    views: dict[tuple[str, str, str], ViewRef] = field(default_factory=dict)
    path_params: dict[str, ParamDoc] = field(default_factory=dict)
    query_params: dict[str, ParamDoc] = field(default_factory=dict)
    request_example: Any = None
    response_example: Any = None
    request_raws: list[str] = field(default_factory=list)
    response_raws: list[str] = field(default_factory=list)
    request_source: str = ""
    response_source: str = ""
    notes: list[str] = field(default_factory=list)


def append_unique(items: list[str], value: str) -> None:
    normalized = normalize_space(value)
    if not normalized:
        return
    if normalized not in items:
        items.append(normalized)


def normalize_space(value: str) -> str:
    return " ".join(value.strip().split())


def strip_ticks(value: str) -> str:
    text = value.strip()
    if len(text) >= 2 and text.startswith("`") and text.endswith("`"):
        return text[1:-1].strip()
    return text


def is_none_value(value: str) -> bool:
    lowered = value.strip().lower()
    return lowered in {"", "n/a", "na", "none", "null", "-"}


def split_frontmatter(text: str) -> tuple[dict[str, str], str]:
    if not text.startswith("---\n"):
        return {}, text
    end_index = text.find("\n---\n", 4)
    if end_index == -1:
        return {}, text

    metadata_block = text[4:end_index]
    body = text[end_index + 5 :]
    metadata: dict[str, str] = {}

    for line in metadata_block.splitlines():
        if ":" not in line:
            continue
        key, raw_value = line.split(":", 1)
        value = raw_value.strip().strip('"').strip("'")
        metadata[key.strip()] = value

    return metadata, body


def extract_section(markdown: str, heading: str) -> str:
    heading_re = re.compile(rf"^##\s+{re.escape(heading)}\s*$", re.MULTILINE)
    match = heading_re.search(markdown)
    if not match:
        return ""

    start = match.end()
    next_heading = re.compile(r"^##\s+", re.MULTILINE).search(markdown, start)
    end = next_heading.start() if next_heading else len(markdown)
    return markdown[start:end].strip()


def parse_markdown_table(section: str) -> list[dict[str, str]]:
    lines = [line.rstrip() for line in section.splitlines() if line.strip()]
    table_start = next((idx for idx, line in enumerate(lines) if line.lstrip().startswith("|")), None)
    if table_start is None:
        return []

    table_lines: list[str] = []
    for line in lines[table_start:]:
        if not line.lstrip().startswith("|"):
            break
        table_lines.append(line)

    if len(table_lines) < 2:
        return []

    headers = [cell.lower() for cell in parse_table_row(table_lines[0])]
    if not headers:
        return []

    records: list[dict[str, str]] = []
    for line in table_lines[1:]:
        if is_separator_row(line):
            continue
        cells = parse_table_row(line)
        if not cells:
            continue

        if len(cells) < len(headers):
            cells = cells + [""] * (len(headers) - len(cells))
        if len(cells) > len(headers):
            cells = cells[: len(headers)]

        record = {headers[idx]: cells[idx] for idx in range(len(headers))}
        records.append(record)

    return records


def parse_table_row(line: str) -> list[str]:
    text = line.strip()
    if text.startswith("|"):
        text = text[1:]
    if text.endswith("|"):
        text = text[:-1]
    return [cell.strip() for cell in text.split("|")]


def is_separator_row(line: str) -> bool:
    normalized = line.replace("|", "").replace(":", "").replace("-", "").strip()
    return normalized == ""


def parse_json_code_blocks(section: str) -> tuple[list[Any], list[str]]:
    models: list[Any] = []
    notes: list[str] = []

    for idx, match in enumerate(re.finditer(r"```json\s*(.*?)```", section, re.IGNORECASE | re.DOTALL), start=1):
        raw = match.group(1).strip()
        if not raw:
            continue
        try:
            models.append(json.loads(raw))
        except json.JSONDecodeError:
            append_unique(notes, f"Could not parse `Data Model` JSON block #{idx}; skipped it.")

    return models, notes


def normalize_path(path: str) -> str:
    normalized = path.strip()
    if not normalized:
        return "/"
    if not normalized.startswith("/"):
        normalized = "/" + normalized
    if normalized != "/" and normalized.endswith("/"):
        normalized = normalized[:-1]
    return normalized


def parse_endpoint_template(endpoint: str) -> tuple[str, list[str], list[tuple[str, str]]]:
    cleaned = strip_ticks(endpoint)
    path_part, query_part = (cleaned.split("?", 1) + [""])[:2]
    normalized_path = normalize_path(path_part)

    path_params = re.findall(r"\{([A-Za-z0-9_]+)\}", normalized_path)
    path_params.extend(re.findall(r":([A-Za-z0-9_]+)", normalized_path))
    path_params = list(dict.fromkeys(path_params))

    query_params: list[tuple[str, str]] = []
    if query_part:
        for chunk in query_part.split("&"):
            if not chunk.strip():
                continue
            if "=" in chunk:
                name, value = chunk.split("=", 1)
            else:
                name, value = chunk, ""
            query_params.append((name.strip(), value.strip()))

    return normalized_path, path_params, query_params


def infer_param_type(name: str) -> str:
    lowered = name.lower()
    if lowered == "id" or lowered.endswith("id"):
        return "string"
    if "date" in lowered:
        return "string (date)"
    if "time" in lowered:
        return "string"
    if "count" in lowered or "total" in lowered:
        return "number"
    if "status" in lowered:
        return "string"
    if lowered.startswith("is") or lowered.startswith("has"):
        return "boolean"
    return "string"


def infer_param_description(name: str, location: str) -> str:
    lowered = name.lower()
    if lowered == "date" or "date" in lowered:
        return "Requested day"
    if lowered == "time" or "time" in lowered:
        return "Requested time value"
    if lowered == "status" or "status" in lowered:
        return "Status filter value"
    if lowered == "id" or lowered.endswith("id"):
        return f"{location.capitalize()} identifier"
    if lowered.startswith("is") or lowered.startswith("has"):
        return f"{location.capitalize()} boolean flag"
    return f"{location.capitalize()} parameter"


def infer_value_from_name(name: str) -> Any:
    lowered = name.lower()
    if lowered == "date" or "date" in lowered:
        return "2026-03-06"
    if lowered == "time" or "time" in lowered:
        return "12:00"
    if lowered == "status" or "status" in lowered:
        return "planned"
    if lowered.startswith("is") or lowered.startswith("has"):
        return False
    if lowered.endswith("count") or lowered.endswith("total") or lowered in {"count", "total"}:
        return 1
    if lowered.endswith("id") or lowered == "id":
        if lowered.startswith("training"):
            return "tr_102"
        if lowered.startswith("athlete"):
            return "ath_18"
        if lowered.startswith("exercise"):
            return "ex_1"
        if lowered.startswith("plan"):
            return "plan_fb_1"
        if lowered.startswith("asset"):
            return "asset_893"
        if lowered.startswith("user"):
            return "usr_120"
        return "id_1"
    return "value"


def build_path_params(path_param_names: list[str], data_models: list[Any]) -> tuple[dict[str, ParamDoc], list[str]]:
    params: dict[str, ParamDoc] = {}
    notes: list[str] = []

    for name in path_param_names:
        example, inferred_note = infer_example_value(name, data_models)
        params[name] = ParamDoc(
            name=name,
            param_type=infer_param_type(name),
            required=True,
            description=infer_param_description(name, "path"),
            example=example,
        )
        if inferred_note:
            append_unique(notes, inferred_note)

    return params, notes


def build_query_params(
    query_pairs: list[tuple[str, str]],
    data_models: list[Any],
) -> tuple[dict[str, ParamDoc], list[str]]:
    params: dict[str, ParamDoc] = {}
    notes: list[str] = []

    for raw_name, raw_value in query_pairs:
        if not raw_name:
            continue
        name = raw_name
        value_template = raw_value
        required = True

        example: Any
        local_note = ""

        placeholder = re.fullmatch(r"\{([^}]+)\}", value_template)
        if placeholder:
            placeholder_name = placeholder.group(1).strip().lower()
            if placeholder_name in {"yyyy-mm-dd", "yyyy-mm", "yyyy"}:
                example = "2026-03-06"
            elif "date" in placeholder_name:
                example = "2026-03-06"
            elif "time" in placeholder_name:
                example = "12:00"
            else:
                example, local_note = infer_example_value(name, data_models)
        elif value_template:
            example = value_template
        else:
            example, local_note = infer_example_value(name, data_models)

        params[name] = ParamDoc(
            name=name,
            param_type=infer_param_type(name),
            required=required,
            description=infer_param_description(name, "query"),
            example=example,
        )

        if local_note:
            append_unique(notes, local_note)

    return params, notes


def infer_example_value(name: str, data_models: list[Any]) -> tuple[Any, str]:
    exact_value = find_value_in_models(data_models, name)
    if exact_value is not MISSING:
        return copy.deepcopy(exact_value), ""

    related_id = find_related_id_value(data_models, name)
    if related_id is not MISSING:
        note = (
            f"Parameter `{name}` example inferred from related `Data Model` identifier because an exact field was not present."
        )
        return copy.deepcopy(related_id), note

    fallback = infer_value_from_name(name)
    note = f"Parameter `{name}` example inferred from naming conventions."
    return fallback, note


def find_related_id_value(data_models: list[Any], name: str) -> Any:
    lowered = name.lower()
    if not (lowered == "id" or lowered.endswith("id")):
        return MISSING

    base = lowered[:-2]
    if not base:
        return MISSING

    for model in data_models:
        queue: list[Any] = [model]
        while queue:
            current = queue.pop(0)
            if isinstance(current, dict):
                for key, value in current.items():
                    key_lower = key.lower()
                    if key_lower == base and isinstance(value, dict) and "id" in value:
                        return value["id"]
                    queue.append(value)
            elif isinstance(current, list):
                queue.extend(current)

    return MISSING


def find_value_in_models(data_models: list[Any], key_name: str) -> Any:
    lowered = key_name.lower()
    for model in data_models:
        found = find_value_in_object(model, lowered)
        if found is not MISSING:
            return found
    return MISSING


def find_value_in_object(value: Any, lowered_key: str) -> Any:
    if isinstance(value, dict):
        for key, nested in value.items():
            if key.lower() == lowered_key:
                return nested
        for nested in value.values():
            found = find_value_in_object(nested, lowered_key)
            if found is not MISSING:
                return found
        return MISSING
    if isinstance(value, list):
        for item in value:
            found = find_value_in_object(item, lowered_key)
            if found is not MISSING:
                return found
    return MISSING


def parse_payload_cell(
    raw_text: str,
    data_models: list[Any],
    endpoint_path: str,
    kind: str,
    request_example: Any = None,
) -> tuple[Any, list[str], str]:
    text = strip_ticks(raw_text).strip()
    if is_none_value(text):
        return None, [], text

    lowered = text.lower()
    if kind == "request" and "multipart/form-data" in lowered:
        return {"file": "<binary>"}, ["Request body inferred from `multipart/form-data` description."], text

    direct_json = try_json_parse(text)
    if direct_json is not MISSING:
        return direct_json, [], text

    if text.startswith("{") and text.endswith("}"):
        parsed_object, object_notes = parse_shorthand_object(text, data_models)
        if parsed_object is not None:
            return parsed_object, object_notes, text

    inferred, inferred_notes = infer_from_text_description(
        text=text,
        kind=kind,
        data_models=data_models,
        endpoint_path=endpoint_path,
        request_example=request_example,
    )
    return inferred, inferred_notes, text


def try_json_parse(text: str) -> Any:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        if len(text) >= 2 and text[0] == text[-1] == "'":
            return text[1:-1]
        return MISSING


def parse_shorthand_object(text: str, data_models: list[Any]) -> tuple[dict[str, Any] | None, list[str]]:
    inner = text[1:-1].strip()
    if not inner:
        return {}, []

    parts = split_top_level_csv(inner)
    result: dict[str, Any] = {}
    notes: list[str] = []
    inferred_fields: list[str] = []

    for part in parts:
        key_part, value_part = split_top_level_colon(part)
        raw_key = key_part.strip().strip('"').strip("'")
        if not raw_key:
            continue

        if value_part is None:
            if raw_key.endswith("[]"):
                key_name = raw_key[:-2]
                value, was_inferred = infer_array_value(key_name, data_models)
            else:
                key_name = raw_key
                value, was_inferred = infer_field_value(key_name, data_models)
        else:
            key_name = raw_key
            value, was_inferred = parse_shorthand_value(value_part.strip(), key_name, data_models)

        result[key_name] = value
        if was_inferred:
            inferred_fields.append(key_name)

    if inferred_fields:
        quoted = ", ".join(f"`{field}`" for field in sorted(set(inferred_fields)))
        append_unique(
            notes,
            f"Expanded shorthand payload fields {quoted} using `Data Model` examples and naming heuristics.",
        )

    return result, notes


def split_top_level_csv(text: str) -> list[str]:
    tokens: list[str] = []
    buffer: list[str] = []
    depth = 0
    in_string = False
    quote_char = ""
    index = 0

    while index < len(text):
        char = text[index]

        if in_string:
            buffer.append(char)
            if char == "\\" and index + 1 < len(text):
                index += 1
                buffer.append(text[index])
            elif char == quote_char:
                in_string = False
        else:
            if char in {'"', "'"}:
                in_string = True
                quote_char = char
                buffer.append(char)
            elif char in "[{":
                depth += 1
                buffer.append(char)
            elif char in "]}":
                depth = max(depth - 1, 0)
                buffer.append(char)
            elif char == "," and depth == 0:
                token = "".join(buffer).strip()
                if token:
                    tokens.append(token)
                buffer = []
            else:
                buffer.append(char)

        index += 1

    token = "".join(buffer).strip()
    if token:
        tokens.append(token)

    return tokens


def split_top_level_colon(text: str) -> tuple[str, str | None]:
    depth = 0
    in_string = False
    quote_char = ""

    for idx, char in enumerate(text):
        if in_string:
            if char == "\\":
                continue
            if char == quote_char:
                in_string = False
            continue

        if char in {'"', "'"}:
            in_string = True
            quote_char = char
            continue

        if char in "[{":
            depth += 1
            continue

        if char in "]}":
            depth = max(depth - 1, 0)
            continue

        if char == ":" and depth == 0:
            return text[:idx], text[idx + 1 :]

    return text, None


def parse_shorthand_value(value_text: str, key_name: str, data_models: list[Any]) -> tuple[Any, bool]:
    value = value_text.strip()

    parsed_json = try_json_parse(value)
    if parsed_json is not MISSING:
        return parsed_json, False

    if value.startswith("{") and value.endswith("}"):
        nested_object, _nested_notes = parse_shorthand_object(value, data_models)
        if nested_object is not None:
            return nested_object, False

    if value.startswith("[") and value.endswith("]"):
        nested_array, inferred = parse_shorthand_array(value, data_models)
        return nested_array, inferred

    if value.endswith("[]") and re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*\[\]", value):
        return infer_array_value(value[:-2], data_models)

    if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", value):
        return infer_field_value(value, data_models)

    inferred = infer_value_from_name(key_name)
    return inferred, True


def parse_shorthand_array(value_text: str, data_models: list[Any]) -> tuple[list[Any], bool]:
    inner = value_text[1:-1].strip()
    if not inner:
        return [], False

    items: list[Any] = []
    inferred_any = False

    for part in split_top_level_csv(inner):
        chunk = part.strip()
        if not chunk:
            continue

        parsed_json = try_json_parse(chunk)
        if parsed_json is not MISSING:
            items.append(parsed_json)
            continue

        if chunk.startswith("{") and chunk.endswith("}"):
            nested_object, _nested_notes = parse_shorthand_object(chunk, data_models)
            if nested_object is not None:
                items.append(nested_object)
                continue

        if chunk.startswith("[") and chunk.endswith("]"):
            nested_array, nested_inferred = parse_shorthand_array(chunk, data_models)
            items.append(nested_array)
            inferred_any = inferred_any or nested_inferred
            continue

        inferred_any = True
        items.append(infer_value_from_name("item"))

    return items, inferred_any


def infer_array_value(key_name: str, data_models: list[Any]) -> tuple[Any, bool]:
    exact = find_value_in_models(data_models, key_name)
    if isinstance(exact, list):
        return copy.deepcopy(exact), False

    plural = key_name + "s"
    plural_match = find_value_in_models(data_models, plural)
    if isinstance(plural_match, list):
        return copy.deepcopy(plural_match), False

    for model in data_models:
        if isinstance(model, list):
            return copy.deepcopy(model), False

    return [], True


def infer_field_value(key_name: str, data_models: list[Any]) -> tuple[Any, bool]:
    exact = find_value_in_models(data_models, key_name)
    if exact is not MISSING:
        return copy.deepcopy(exact), False

    if key_name.lower().endswith("id"):
        related = find_related_id_value(data_models, key_name)
        if related is not MISSING:
            return copy.deepcopy(related), True

    return infer_value_from_name(key_name), True


def infer_from_text_description(
    text: str,
    kind: str,
    data_models: list[Any],
    endpoint_path: str,
    request_example: Any = None,
) -> tuple[Any, list[str]]:
    lowered = text.lower()
    dict_model = next((copy.deepcopy(model) for model in data_models if isinstance(model, dict)), None)
    list_model = next((copy.deepcopy(model) for model in data_models if isinstance(model, list)), None)
    notes: list[str] = []

    if kind == "request":
        append_unique(notes, f"Request body shape for `{endpoint_path}` was not JSON; using an empty object placeholder.")
        append_unique(notes, f"Original request description: `{text}`.")
        return {}, notes

    if "list" in lowered:
        if list_model is not None:
            append_unique(notes, "Response body inferred as a list from textual API description and `Data Model` examples.")
            return list_model, notes
        append_unique(notes, "Response body inferred as an array from textual API description; detailed item schema was not provided.")
        return [], notes

    if "persisted sets" in lowered or "sets" in lowered:
        sets_value = MISSING
        if isinstance(request_example, dict) and "sets" in request_example:
            sets_value = request_example["sets"]
        if sets_value is MISSING:
            sets_value = find_value_in_models(data_models, "currentResults")
        if sets_value is MISSING:
            sets_value = []
        append_unique(notes, "Response body inferred as persisted set data based on API description.")
        return {"sets": copy.deepcopy(sets_value)}, notes

    if any(token in lowered for token in ("updated", "object", "summary", "context")) and dict_model is not None:
        append_unique(notes, "Response body inferred from `Data Model` because API response was a textual description.")
        return dict_model, notes

    if dict_model is not None:
        append_unique(notes, "Response body inferred from `Data Model` because API response was not provided as JSON.")
        return dict_model, notes

    if list_model is not None:
        append_unique(notes, "Response body inferred from list-like `Data Model` example because API response was not provided as JSON.")
        return list_model, notes

    append_unique(notes, f"Response shape for `{endpoint_path}` is unspecified; using an empty object placeholder.")
    append_unique(notes, f"Original response description: `{text}`.")
    return {}, notes


def parse_view_file(path: Path) -> list[EndpointRecord]:
    content = path.read_text(encoding="utf-8")
    metadata, body = split_frontmatter(content)

    view_ref = ViewRef(
        view_id=metadata.get("id", path.stem),
        route=metadata.get("route", "n/a"),
        name=metadata.get("name", "n/a"),
        title=metadata.get("title", ""),
    )

    data_model_section = extract_section(body, "Data Model")
    data_models, model_notes = parse_json_code_blocks(data_model_section)

    api_section = extract_section(body, "API")
    rows = parse_markdown_table(api_section)

    records: list[EndpointRecord] = []

    for row in rows:
        method = row.get("method", "").upper().strip()
        endpoint = row.get("endpoint", "").strip()
        summary = normalize_space(row.get("purpose", ""))
        request_cell = row.get("request", "")
        response_cell = row.get("response", "")

        if not method or not endpoint:
            continue

        path_only, path_param_names, query_pairs = parse_endpoint_template(endpoint)

        path_params, path_param_notes = build_path_params(path_param_names, data_models)
        query_params, query_param_notes = build_query_params(query_pairs, data_models)

        request_example, request_notes, request_raw = parse_payload_cell(
            raw_text=request_cell,
            data_models=data_models,
            endpoint_path=path_only,
            kind="request",
        )

        response_example, response_notes, response_raw = parse_payload_cell(
            raw_text=response_cell,
            data_models=data_models,
            endpoint_path=path_only,
            kind="response",
            request_example=request_example,
        )

        notes: list[str] = []
        for note in model_notes + path_param_notes + query_param_notes + request_notes + response_notes:
            append_unique(notes, note)

        records.append(
            EndpointRecord(
                method=method,
                path=path_only,
                endpoint_template=endpoint,
                summary=summary,
                view=view_ref,
                path_params=path_params,
                query_params=query_params,
                request_example=request_example,
                response_example=response_example,
                request_raw=request_raw,
                response_raw=response_raw,
                notes=notes,
            )
        )

    return records


def merge_records(records: list[EndpointRecord], existing_notes: dict[tuple[str, str], list[str]]) -> list[EndpointDoc]:
    merged: dict[tuple[str, str], EndpointDoc] = {}

    for record in records:
        key = (record.method, record.path)
        endpoint = merged.setdefault(key, EndpointDoc(method=record.method, path=record.path))

        append_unique(endpoint.summaries, record.summary)
        endpoint.views[(record.view.view_id, record.view.route, record.view.name)] = record.view

        merge_params(endpoint.path_params, record.path_params, endpoint.notes, "path")
        merge_params(endpoint.query_params, record.query_params, endpoint.notes, "query")

        if not is_none_value(record.request_raw):
            append_unique(endpoint.request_raws, record.request_raw)
        if not is_none_value(record.response_raw):
            append_unique(endpoint.response_raws, record.response_raw)

        merge_payload_example(
            endpoint=endpoint,
            payload_kind="request",
            incoming=record.request_example,
            source_view=record.view.view_id,
        )
        merge_payload_example(
            endpoint=endpoint,
            payload_kind="response",
            incoming=record.response_example,
            source_view=record.view.view_id,
        )

        for note in record.notes:
            append_unique(endpoint.notes, note)

    for key, notes in existing_notes.items():
        if key not in merged:
            continue
        for note in notes:
            append_unique(merged[key].notes, note)

    return sorted(
        merged.values(),
        key=lambda item: (item.path, METHOD_PRIORITY.get(item.method, 99), item.method),
    )


def merge_params(
    target: dict[str, ParamDoc],
    incoming: dict[str, ParamDoc],
    notes: list[str],
    location: str,
) -> None:
    for name, incoming_param in incoming.items():
        existing = target.get(name)
        if existing is None:
            target[name] = incoming_param
            continue

        if existing.param_type != incoming_param.param_type:
            append_unique(
                notes,
                f"Conflicting inferred types for {location} parameter `{name}`; kept `{existing.param_type}`.",
            )

        if existing.example != incoming_param.example:
            append_unique(
                notes,
                f"Multiple examples found for {location} parameter `{name}`; kept `{format_scalar(existing.example)}`.",
            )


def merge_payload_example(endpoint: EndpointDoc, payload_kind: str, incoming: Any, source_view: str) -> None:
    if payload_kind == "request":
        current = endpoint.request_example
        source_field = "request_source"
        value_field = "request_example"
    else:
        current = endpoint.response_example
        source_field = "response_source"
        value_field = "response_example"

    if current is None and incoming is not None:
        setattr(endpoint, value_field, copy.deepcopy(incoming))
        setattr(endpoint, source_field, source_view)
        return

    if incoming is None:
        return

    if current != incoming:
        chosen_source = getattr(endpoint, source_field) or "first source"
        append_unique(
            endpoint.notes,
            f"Multiple {payload_kind} examples detected across views; kept the first parsed example from `{chosen_source}`.",
        )


def parse_existing_endpoint_notes(content: str) -> dict[tuple[str, str], list[str]]:
    notes_by_endpoint: dict[tuple[str, str], list[str]] = {}

    current_key: tuple[str, str] | None = None
    in_notes = False

    for raw_line in content.splitlines():
        line = raw_line.strip()

        endpoint_match = re.match(r"^##\s+([A-Z]+)\s+([^\s]+)\s*$", line)
        if endpoint_match:
            method = endpoint_match.group(1)
            path = normalize_path(endpoint_match.group(2).split("?", 1)[0])
            current_key = (method, path)
            notes_by_endpoint.setdefault(current_key, [])
            in_notes = False
            continue

        if line.startswith("### "):
            in_notes = line.lower() == "### notes"
            continue

        if line.startswith("## "):
            in_notes = False
            continue

        if in_notes and current_key is not None:
            bullet_match = re.match(r"^[-*]\s+(.*\S)\s*$", line)
            if bullet_match:
                append_unique(notes_by_endpoint[current_key], bullet_match.group(1))

    return notes_by_endpoint


def render_param_section(params: dict[str, ParamDoc]) -> list[str]:
    if not params:
        return ["None"]

    lines = [
        "| name | type | required | description | example |",
        "| ---- | ---- | -------- | ----------- | ------- |",
    ]

    for name in sorted(params.keys()):
        param = params[name]
        lines.append(
            "| "
            + " | ".join(
                [
                    escape_pipe(param.name),
                    escape_pipe(param.param_type),
                    "yes" if param.required else "no",
                    escape_pipe(param.description),
                    escape_pipe(format_scalar(param.example)),
                ]
            )
            + " |"
        )

    return lines


def render_payload_section(payload: Any) -> list[str]:
    if payload is None:
        return ["None"]

    dumped = json.dumps(payload, indent=2, ensure_ascii=False)
    return ["Example structure:", "", "```json", dumped, "```"]


def render_endpoint(endpoint: EndpointDoc) -> list[str]:
    lines: list[str] = []

    lines.append(f"## {endpoint.method} {endpoint.path}")
    lines.append("")
    lines.append("### Summary")
    lines.append("")
    lines.append(endpoint.summaries[0] if endpoint.summaries else "No summary provided in the source view table.")
    lines.append("")
    lines.append("### Used in Views")
    lines.append("")

    used_views = sorted(endpoint.views.values(), key=lambda view: (view.route, view.view_id, view.name))
    for view in used_views:
        lines.append(f"- {view.view_id} (`{view.route}`, `{view.name}`)")

    lines.append("")
    lines.append("### Query Parameters")
    lines.append("")
    lines.extend(render_param_section(endpoint.query_params))

    lines.append("")
    lines.append("### Path Parameters")
    lines.append("")
    lines.extend(render_param_section(endpoint.path_params))

    lines.append("")
    lines.append("### Request Body")
    lines.append("")
    lines.extend(render_payload_section(endpoint.request_example))

    lines.append("")
    lines.append("### Response Body")
    lines.append("")
    lines.extend(render_payload_section(endpoint.response_example))

    lines.append("")
    lines.append("### Notes")
    lines.append("")

    if endpoint.notes:
        for note in endpoint.notes:
            lines.append(f"- {note}")
    else:
        lines.append("- None.")

    return lines


def render_generated_section(endpoints: list[EndpointDoc]) -> str:
    lines: list[str] = ["## Endpoints Index", ""]

    if not endpoints:
        lines.append("- No endpoints found in `*.view.md` files.")
    else:
        for endpoint in endpoints:
            lines.append(f"- `{endpoint.method} {endpoint.path}`")

    for endpoint in endpoints:
        lines.extend(["", "---", ""])
        lines.extend(render_endpoint(endpoint))

    return "\n".join(lines).rstrip()


def build_generated_block(generated_section: str) -> str:
    return "\n".join(
        [
            GENERATED_SECTION_MARKER,
            GENERATED_SECTION_START,
            generated_section,
            GENERATED_SECTION_END,
        ]
    )


def inject_generated_section(existing_content: str, generated_section: str) -> str:
    generated_block = build_generated_block(generated_section)

    if not existing_content.strip():
        return f"{DOCUMENT_HEADER}\n\n{generated_block}\n"

    start_idx = existing_content.find(GENERATED_SECTION_START)
    end_idx = existing_content.find(GENERATED_SECTION_END)
    marker_idx = existing_content.find(GENERATED_SECTION_MARKER)

    if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
        block_start = marker_idx if marker_idx != -1 and marker_idx < start_idx else start_idx
        prefix = existing_content[:block_start].rstrip()
        suffix = existing_content[end_idx + len(GENERATED_SECTION_END) :].lstrip("\n")

        pieces = [piece for piece in [prefix, generated_block.strip(), suffix.rstrip()] if piece]
        return "\n\n".join(pieces) + "\n"

    if marker_idx != -1:
        prefix = existing_content[:marker_idx].rstrip()
        suffix = existing_content[marker_idx + len(GENERATED_SECTION_MARKER) :].lstrip("\n")

        pieces = [piece for piece in [prefix, generated_block.strip(), suffix.rstrip()] if piece]
        return "\n\n".join(pieces) + "\n"

    return existing_content.rstrip() + "\n\n" + generated_block + "\n"


def escape_pipe(value: str) -> str:
    return value.replace("|", "\\|")


def format_scalar(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        return "null"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False)


def collect_view_files(repo_root: Path, pattern: str) -> list[Path]:
    return sorted(
        path
        for path in repo_root.glob(pattern)
        if path.is_file() and not is_ignored_view_path(path, repo_root)
    )


def is_ignored_view_path(path: Path, repo_root: Path) -> bool:
    try:
        relative = path.relative_to(repo_root)
    except ValueError:
        return True

    ignored_directories = {"node_modules", "dist", "build", "__pycache__"}
    for part in relative.parts:
        if part.startswith("."):
            return True
        if part in ignored_directories:
            return True

    return False


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate docs/api.md from *.view.md files.")
    parser.add_argument(
        "--repo-root",
        default=".",
        help="Repository root path used for file scanning and output resolution.",
    )
    parser.add_argument(
        "--views-glob",
        default="**/*.view.md",
        help="Glob pattern used to discover view files.",
    )
    parser.add_argument(
        "--output",
        default="docs/api.md",
        help="Path to the API documentation file, relative to --repo-root.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = Path(args.repo_root).resolve()
    output_path = (repo_root / args.output).resolve()

    view_files = collect_view_files(repo_root, args.views_glob)
    records: list[EndpointRecord] = []

    for view_file in view_files:
        records.extend(parse_view_file(view_file))

    existing_content = output_path.read_text(encoding="utf-8") if output_path.exists() else ""
    existing_notes = parse_existing_endpoint_notes(existing_content)

    merged = merge_records(records, existing_notes)
    generated_section = render_generated_section(merged)
    next_content = inject_generated_section(existing_content, generated_section)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(next_content, encoding="utf-8")

    print(
        f"Generated {len(merged)} endpoint docs from {len(view_files)} view files -> {output_path}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
