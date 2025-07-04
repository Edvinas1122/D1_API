#!/bin/sh

# example use ./chat.sh send http://localhost:8787 mychatid "Hello there!"

TEST="$1"
BASE_URL="$2"
CHAT_ID="${3:-test-chat-id}"
CONTENT="${4:-hello-world}"

if [ -z "$TEST" ] || [ -z "$BASE_URL" ]; then
  echo "Usage: $0 <test_name|all> <base_url> [chat_id] [content]"
  echo "Tests: root, create_and_invite, accept, send, all"
  echo 'example use ./chat.sh send http://localhost:8787 plug-bug:1751493283237 "Hello there!"'
  exit 1
fi

run_root() {
  echo "▶ Testing root endpoint"
  curl -s "$BASE_URL/" && echo
}

run_create_and_invite() {
  echo "▶ Testing /create_and_invite"
  curl -s "$BASE_URL/create_and_invite" && echo
}

run_accept() {
  echo "▶ Testing /accept with chat=$CHAT_ID"
  curl -s "$BASE_URL/accept?chat=$CHAT_ID" && echo
}

run_send() {
  echo "▶ Testing /send with chat=$CHAT_ID and content=$CONTENT"
  curl -s "$BASE_URL/send?chat=$CHAT_ID&content=$CONTENT" && echo
}

case "$TEST" in
  root)
    run_root
    ;;
  create_and_invite)
    run_create_and_invite
    ;;
  accept)
    run_accept
    ;;
  send)
    run_send
    ;;
  all)
    run_root
    run_create_and_invite
    run_accept
    run_send
    ;;
  *)
    echo "Unknown test: $TEST"
    exit 1
    ;;
esac
