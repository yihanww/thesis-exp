# To use this, make sure to reset the database first.

import json
import random
import string
from datetime import datetime, timedelta

import pysnooper
import requests

from cli import reset_db
from config import Settings

settings = Settings()
base_url = "http://127.0.0.1:8000"


def generate_random_string(length=10):
    return "".join(random.choices(string.ascii_uppercase, k=length))


def generate_participant_info():
    """Generates a random set of participant information in order
    to initialize the experiment. Does not conform to Amazon or Prolific
    participant information formats."""
    length = 10
    return {
        "worker_id": generate_random_string(length=length),
        "hit_id": generate_random_string(length=length),
        "assignment_id": generate_random_string(length=length),
        "platform": "prolific",
    }


def generate_dummy_trial_data():
    """Generates dummy trial data in the form of a list of dictionaries.
    Does not actually look like real trial data in the context of the experiment."""
    length = 5
    return [
        {
            "entry_1": generate_random_string(length=length),
            "entry_2": generate_random_string(length=length),
        },
        {
            "entry_1": generate_random_string(length=length),
            "entry_2": generate_random_string(length=length),
        },
    ]


# @pysnooper.snoop()
def test_app(num_participants=1000):
    """Tests the application. Generates many participants,
    creates associated data, posts it, or has them time out at
    random."""

    # TODO: timeout -- update to have created_at be before start time
    now = datetime.utcnow()
    min_start_time = now - timedelta(seconds=settings.allotted_time)
    timeout_start_time = min_start_time - timedelta(seconds=10)
    probability_of_timeout = 0.2
    probability_of_refresh = 0.1

    for i in range(num_participants):
        timeout_participant = random.random() < probability_of_timeout
        refresh = random.random() < probability_of_refresh

        # Do for many participants
        trial_data = generate_dummy_trial_data()
        participant_info = generate_participant_info()
        assignment_info = requests.post(
            f"{base_url}/init", json=participant_info
        ).json()

        updated_participant_info = {
            "worker_id": participant_info.get("worker_id"),
            "status": "working_finished_consent",
            "end_time": None,
        }

        participant_info_to_add = (
            {
                "start_time": str(timeout_start_time),
            }
            if timeout_participant
            else {}
        )

        updated_participant_info = {
            **updated_participant_info,
            **participant_info_to_add,
        }

        updated_assignment_info = requests.patch(
            f"{base_url}/participants", json=updated_participant_info
        ).json()

        if refresh:
            timeout_response = requests.get(f"{base_url}/refresh").json()
            continue

        final_data = {
            **participant_info,
            "condition": assignment_info.get("condition"),
            "images": assignment_info.get("images"),
            "status": "complete",
            "data": trial_data,
        }

        data_response = requests.post(f"{base_url}/data", json=final_data).json()


if __name__ == "__main__":
    test_app(num_participants=200)
