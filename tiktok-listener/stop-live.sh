#!/data/data/com.termux/files/usr/bin/bash
# stop-live.sh - Hentikan listener Jalur Tarot & lepas wake-lock
# Taruh di ~/jalurtarot-live/tiktok-listener/stop-live.sh, chmod +x, jalankan: ./stop-live.sh

SESSION="tarot"

if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "[live] Menghentikan session tmux '$SESSION'..."
  tmux kill-session -t "$SESSION"
else
  echo "[live] Tidak ada session tmux '$SESSION' yang jalan."
fi

echo "[live] Melepas termux-wake-lock..."
termux-wake-unlock >/dev/null 2>&1 || true

echo "[live] Selesai."
