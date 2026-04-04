#!/usr/bin/env python3
"""Test script to verify routes are registered."""

from main import app

print("="*60)
print("ChillInsure Backend - Route Registry")
print("="*60)

for i, route in enumerate(app.routes, 1):
    methods = getattr(route, 'methods', set(['N/A']))
    print(f"{i}. {route.path:40} | {str(methods)[:20]}")

print("="*60)
print(f"Total routes: {len(app.routes)}")
