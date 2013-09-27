#!/bin/bash
# Build config for build.sh
VERSION=$(grep "em:version" "install.rdf"|sed -e 's|<[^>]\+>||g' -e 's|\s\+||g')
APP_NAME="shelve-$VERSION"
CHROME_PROVIDERS="content locale skin"
CLEAN_UP=1
ROOT_FILES=
ROOT_DIRS="defaults"
BEFORE_BUILD=
AFTER_BUILD=
