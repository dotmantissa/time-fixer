# v0.1.0
# { "Depends": "py-genlayer:latest" }

from genlayer import *
import json
import re


class TimeFixer(gl.Contract):
    """
    Converts natural language time into Unix Timestamp.
    """

    timestamps: TreeMap[str, u256]

    def __init__(self):
        pass

    def _resolve_deterministic_timestamp(self, text: str, anchor_unix: int) -> int:
        normalized = text.strip().lower()

        if normalized in ("now", "right now", "current time"):
            return anchor_unix
        if normalized == "yesterday":
            return anchor_unix - 86400
        if normalized == "tomorrow":
            return anchor_unix + 86400

        match = re.match(r"^(\d+)\s+(second|minute|hour|day)s?\s+ago$", normalized)
        if match:
            amount = int(match.group(1))
            unit = match.group(2)
            unit_seconds = {
                "second": 1,
                "minute": 60,
                "hour": 3600,
                "day": 86400,
            }
            return anchor_unix - amount * unit_seconds[unit]

        match = re.match(r"^in\s+(\d+)\s+(second|minute|hour|day)s?$", normalized)
        if match:
            amount = int(match.group(1))
            unit = match.group(2)
            unit_seconds = {
                "second": 1,
                "minute": 60,
                "hour": 3600,
                "day": 86400,
            }
            return anchor_unix + amount * unit_seconds[unit]

        return -1

    @gl.public.write
    def to_unix_timestamp(self, natural_language_time: str) -> None:
        """
        Resolves relative time to Unix timestamp using worldtimeapi.org as anchor.
        Returns NONE to avoid simulator serialization crashes.
        """

        time_api_url = "http://worldtimeapi.org/api/timezone/Etc/UTC"

        def resolve_time_nondet() -> str:
            print(f"Fetching Reference Time from: {time_api_url}")
            current_time_str = "Unknown"
            anchor_unix = 0
            try:
                api_content = gl.nondet.web.render(time_api_url, mode="text")
                if "datetime" in api_content:
                    current_time_str = api_content
                parsed_content = json.loads(api_content)
                anchor_unix = int(parsed_content.get("unixtime", 0))
            except Exception as e:
                print(f"Time Fetch failed: {e}")

            # Fast deterministic path for common relative expressions.
            if anchor_unix > 0:
                deterministic_ts = self._resolve_deterministic_timestamp(
                    natural_language_time, anchor_unix
                )
                if deterministic_ts >= 0:
                    return json.dumps({"timestamp": deterministic_ts})

            task = f"""
            Act as a Time Resolver.

            Context:
            - Current Reference Time (UTC): {current_time_str}
            - If Reference is Unknown, use execution time.

            Task:
            - Convert this natural language input to UNIX TIMESTAMP (seconds): "{natural_language_time}"
            - Examples: "2 hours ago", "yesterday".

            Output:
            - Return ONLY the integer timestamp.

            Respond using ONLY JSON:
            {{ "timestamp": int }}
            """

            result_raw = gl.nondet.exec_prompt(task)

            try:
                cleaned = result_raw.replace("```json", "").replace("```", "").strip()
                json.loads(cleaned)
                return cleaned
            except Exception:
                return json.dumps({"timestamp": 0})

        comparison_criteria = """
        Compare 'timestamp' integers.
        Equal if abs(val_a - val_b) <= 3600.
        """

        consensus_json = gl.eq_principle.prompt_comparative(
            resolve_time_nondet,
            comparison_criteria,
        )

        try:
            parsed = json.loads(consensus_json)
            ts = int(parsed.get("timestamp", 0))
            if ts < 0:
                ts = 0
            self.timestamps[natural_language_time] = u256(ts)
        except Exception:
            self.timestamps[natural_language_time] = u256(0)

        return None

    @gl.public.view
    def get_timestamp(self, natural_language_time: str) -> int:
        if natural_language_time in self.timestamps:
            return int(self.timestamps[natural_language_time])
        return 0
