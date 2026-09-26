#!/data/data/com.termux/files/usr/bin/bash
# live.sh - Jalankan TikTok Listener Jalur Tarot di Termux (sekali jalan)
#
# Taruh file ini di ~/jalurtarot-live/tiktok-listener/live.sh
# lalu: chmod +x live.sh
# Jalankan tiap mau live: ./live.sh
#
# Perilaku:
#   - git pull update terbaru (bisa dilewati: SKIP_PULL=1 ./live.sh)
#   - npm install kalau node_modules belum ada / package.json berubah
#   - aktifkan termux-wake-lock
#   - kalau session tmux "tarot" sudah jalan -> langsung attach
#   - kalau belum -> buat session baru, jalankan npm start di dalamnya
#
# Detach dari tmux tanpa mematikan listener: Ctrl+B lalu D

set -e

SESSION="tarot"
REPO_DIR="$HOME/jalurtarot-live"
BOT_DIR="$REPO_DIR/tiktok-listener"

info()  { echo -e "\033[1;36m[live]\033[0m $1"; }
warn()  { echo -e "\033[1;33m[live]\033[0m $1"; }
error() { echo -e "\033[1;31m[live]\033[0m $1"; }

# 0. Pastikan tmux ada
if ! command -v tmux >/dev/null 2>&1; then
  error "tmux belum terinstall. Jalankan: pkg install nodejs git tmux -y"
  exit 1
fi

# 1. Kalau session tmux sudah jalan, langsung masuk (listener tidak diulang)
if tmux has-session -t "$SESSION" 2>/dev/null; then
  info "Session '$SESSION' sudah jalan, langsung attach..."
  termux-wake-lock >/dev/null 2>&1 || true
  exec tmux attach -t "$SESSION"
fi

# 2. Pastikan repo ada
if [ ! -d "$BOT_DIR" ]; then
  error "Folder $BOT_DIR tidak ditemukan."
  error "Clone dulu: git clone https://github.com/harvey-moeid/jalurtarot-live.git ~/jalurtarot-live"
  exit 1
fi

cd "$REPO_DIR"

# 3. Update repo (skip dengan SKIP_PULL=1)
if [ "$SKIP_PULL" != "1" ]; then
  info "Menarik update terbaru (git pull)..."
  git pull --ff-only || warn "git pull gagal/dilewati, lanjut pakai kode lokal."
else
  info "SKIP_PULL=1, lewati git pull."
fi

cd "$BOT_DIR"

# 4. Pastikan .env ada
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    warn ".env belum ada, membuat dari .env.example..."
    cp .env.example .env
    error "Isi dulu tiktok-listener/.env (TIKTOK_USERNAME, WORKER_URL, LIVE_SECRET, dst), lalu jalankan lagi ./live.sh"
    exit 1
  else
    error ".env dan .env.example tidak ditemukan di $BOT_DIR"
    exit 1
  fi
fi

# 5. Install dependency kalau perlu
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  info "Install/menyesuaikan dependency (npm install)..."
  npm install
fi

# 6. Wake lock supaya tidak mati saat layar terkunci
info "Mengaktifkan termux-wake-lock..."
termux-wake-lock >/dev/null 2>&1 || warn "termux-wake-lock gagal (butuh Termux:API app?)."

# 7. Checklist singkat sebelum live
echo
info "Checklist cepat sebelum live:"
echo "  [ ] Akun TikTok sudah LIVE"
echo "  [ ] Overlay /live sudah dibuka sebagai Browser Source di OBS"
echo "  [ ] .env: TIKTOK_USERNAME, WORKER_URL, LIVE_SECRET sudah benar"
echo

# 8. Mulai session tmux baru, jalankan listener di dalamnya
info "Membuat session tmux '$SESSION' dan menjalankan npm start..."
tmux new-session -d -s "$SESSION" -c "$BOT_DIR" "npm start"
sleep 1
exec tmux attach -t "$SESSION"
