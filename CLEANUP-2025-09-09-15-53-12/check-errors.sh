#!/bin/bash
cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend
export PATH=/usr/local/bin:$PATH
npx tsc --noEmit 2>&1 | wc -l
