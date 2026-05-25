def build_version_payload(service: str, version: str, environment: str) -> dict[str, str]:
    return {
        "service": service,
        "version": version,
        "environment": environment,
    }
