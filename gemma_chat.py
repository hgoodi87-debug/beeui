#!/usr/bin/env python3
"""잼빵이 채팅 스크립트 (Ollama 로컬)"""

import json
import sys
import urllib.request

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "jaembbong:latest"  # 잼빵이!

def chat(history):
    data = json.dumps({"model": MODEL, "messages": history, "stream": False}).encode()
    req = urllib.request.Request(OLLAMA_URL, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read())["message"]["content"]

def main():
    print(f"\n🍞 잼빵이 ({MODEL}) 채팅 시작! 종료하려면 'quit'\n")
    print("-" * 50)
    history = []

    while True:
        try:
            user_input = input("나: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n👋 잘가요~")
            break

        if user_input.lower() in ("quit", "exit", "종료"):
            print("👋 잘가요~")
            break
        if not user_input:
            continue

        history.append({"role": "user", "content": user_input})
        try:
            reply = chat(history)
            history.append({"role": "assistant", "content": reply})
            print(f"\n잼빵이: {reply}\n")
        except Exception as e:
            print(f"\n❌ 에러: {e}\n")

if __name__ == "__main__":
    main()
