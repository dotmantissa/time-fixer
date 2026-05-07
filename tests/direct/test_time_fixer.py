import json


def deploy(direct_deploy):
    return direct_deploy("contracts/time_fixer.py")


def test_to_unix_timestamp_stores_value(direct_vm, direct_deploy, direct_alice):
    contract = deploy(direct_deploy)
    direct_vm.sender = direct_alice

    direct_vm.mock_web(
        r".*worldtimeapi\.org/api/timezone/Etc/UTC.*",
        {
            "status": 200,
            "body": json.dumps(
                {"datetime": "2026-05-07T00:00:00+00:00", "unixtime": 1778112000}
            ),
        },
    )

    contract.to_unix_timestamp("2 hours ago")

    assert contract.get_timestamp("2 hours ago") == 1778104800


def test_to_unix_timestamp_yesterday_uses_anchor(direct_vm, direct_deploy, direct_alice):
    contract = deploy(direct_deploy)
    direct_vm.sender = direct_alice

    direct_vm.mock_web(
        r".*worldtimeapi\.org/api/timezone/Etc/UTC.*",
        {
            "status": 200,
            "body": json.dumps(
                {"datetime": "2026-05-07T00:00:00+00:00", "unixtime": 1778112000}
            ),
        },
    )

    contract.to_unix_timestamp("yesterday")

    assert contract.get_timestamp("yesterday") == 1778025600


def test_to_unix_timestamp_uses_llm_for_non_deterministic_phrase(
    direct_vm, direct_deploy, direct_alice
):
    contract = deploy(direct_deploy)
    direct_vm.sender = direct_alice

    direct_vm.mock_web(
        r".*worldtimeapi\.org/api/timezone/Etc/UTC.*",
        {
            "status": 200,
            "body": json.dumps(
                {"datetime": "2026-05-07T00:00:00+00:00", "unixtime": 1778112000}
            ),
        },
    )
    direct_vm.mock_llm(
        r".*Convert this natural language input to UNIX TIMESTAMP.*next friday at noon.*",
        json.dumps({"timestamp": 1778452800}),
    )

    contract.to_unix_timestamp("next friday at noon")

    assert contract.get_timestamp("next friday at noon") == 1778452800


def test_get_timestamp_missing_key_returns_zero(direct_deploy):
    contract = deploy(direct_deploy)

    assert contract.get_timestamp("never set") == 0
