#!/bin/sh
set -e

if [ "$CLAMAV_UPDATE_DB" = "true" ]; then
    echo "Updating ClamAV definitions..."
    freshclam
fi

exec "$@"