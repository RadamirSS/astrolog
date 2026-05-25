"""Reference fixture metadata for demo tenants.

Full config payloads are built by saas_api.services.seed_builder at seed time.
"""

DEMO_TENANTS = [
    {
        "id": "tenant_mystic",
        "slug": "mystic-dark",
        "displayName": "Mystic Veil Astrology",
        "preset": "mystic-dark",
    },
    {
        "id": "tenant_soft",
        "slug": "soft-feminine",
        "displayName": "Rose Moon Readings",
        "preset": "soft-feminine",
    },
    {
        "id": "tenant_luxury",
        "slug": "luxury-gold",
        "displayName": "Celestial Elite",
        "preset": "luxury-gold",
    },
]
