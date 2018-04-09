#!/bin/sh

(cd backend && npm install && npm run build)
(cd website && npm install && npm run build)
