import time
from collections import defaultdict

login_attempts = defaultdict(list)

MAX_ATTEMPTS = 5
WINDOW = 60


def check_rate_limit(ip):

    now = time.time()

    attempts = login_attempts[ip]

    login_attempts[ip] = [t for t in attempts if now - t < WINDOW]

    if len(login_attempts[ip]) >= MAX_ATTEMPTS:
        return False

    login_attempts[ip].append(now)

    return True


def brute_force_delay():
    time.sleep(1)