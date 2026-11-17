import requests
from flask import current_app


def request_laravel(method, path, *, payload=None):
    token = current_app.config["LARAVEL_SERVICE_TOKEN"]
    if not token:
        return {"message": "Laravel integration is not configured."}, 503

    url = f"{current_app.config['LARAVEL_API_URL'].rstrip('/')}/{path.lstrip('/')}"
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {token}",
    }

    try:
        response = requests.request(
            method,
            url,
            headers=headers,
            json=payload,
            timeout=(3, 10),
        )
    except requests.Timeout:
        current_app.logger.warning("Laravel API request timed out.")
        return {"message": "The workshop service did not respond in time."}, 504
    except requests.RequestException:
        current_app.logger.exception("Laravel API request failed.")
        return {"message": "The workshop service is unavailable."}, 502

    if response.status_code >= 500:
        current_app.logger.error(
            "Laravel API returned a server error (HTTP %s).",
            response.status_code,
        )
        return {"message": "The workshop service encountered an error."}, 502

    try:
        body = response.json()
    except ValueError:
        current_app.logger.error("Laravel API returned a non-JSON response.")
        return {"message": "The workshop service returned an invalid response."}, 502

    if response.status_code in (401, 403):
        current_app.logger.error(
            "Laravel rejected the server integration token (HTTP %s).",
            response.status_code,
        )
        return {"message": "The workshop service rejected its integration credentials."}, 502

    if not isinstance(body, (dict, list)):
        current_app.logger.error("Laravel API returned an unexpected JSON shape.")
        return {"message": "The workshop service returned an invalid response."}, 502

    return body, response.status_code
