#!/bin/bash
# 在所有介面啟動靜態伺服器，讓 Cursor 內建瀏覽器（獨立進程）也能連線
cd /Users/wuwenlong/Desktop/ButterflyHK || exit 1
PORT=8765
nohup python3 -m http.server $PORT --bind 0.0.0.0 >/tmp/server.log 2>&1 </dev/null &
disown 2>/dev/null
sleep 3
for i in $(seq 1 5); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 4 "http://127.0.0.1:$PORT/index.html")
  echo "127.0.0.1:$PORT -> $code"
  [ "$code" = "200" ] && break
  sleep 2
done
echo "--- server.log ---"
cat /tmp/server.log
