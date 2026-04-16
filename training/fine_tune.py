#!/usr/bin/env python3
"""
빌리버 Gemma 4 LoRA 파인튜닝 파이프라인
베이스: google/gemma-4-4b-it (HuggingFace)
방법:  unsloth QLoRA → GGUF 변환 → Ollama 탑재
"""

import argparse
import json
import os
import subprocess
import sys

# ─────────────────────────────────────────────
# 설정
# ─────────────────────────────────────────────

BASE_MODEL_HF = "google/gemma-4-4b-it"   # HuggingFace 모델 ID

MODELS = {
    "jaembbong": {
        "data":        "training/jaembbong_train.jsonl",
        "output":      "training/output_jaembbong",
        "gguf_name":   "jaembbong.gguf",
        "ollama_name": "jaembbong",
        "system":      (
            "You are Beeliber's customer service AI. "
            "Website: bee-liber.com | Hours: 09:00~21:00. "
            "Always end with: 가벼운 여행 되세요! 🐝"
        ),
    },
    "beeliber-bee": {
        "data":        "training/beeliber_bee_train.jsonl",
        "output":      "training/output_beeliber_bee",
        "gguf_name":   "beeliber_bee.gguf",
        "ollama_name": "beeliber-bee",
        "system":      (
            "당신은 빌리버 내부 운영 어시스턴트입니다. "
            "직원과 관리자의 운영 업무를 지원합니다."
        ),
    },
}


# ─────────────────────────────────────────────
# Step 0: HuggingFace 로그인 확인
# ─────────────────────────────────────────────

def check_hf_login():
    result = subprocess.run(
        ["huggingface-cli", "whoami"],
        capture_output=True, text=True
    )
    if "NOT_FOUND" in result.stderr or result.returncode != 0:
        print("⚠️  HuggingFace 로그인 필요!")
        print("터미널에서 실행: huggingface-cli login")
        print("토큰 발급: https://huggingface.co/settings/tokens\n")
        sys.exit(1)
    user = result.stdout.strip().split("\n")[0]
    print(f"✅ HuggingFace 로그인: {user}")


# ─────────────────────────────────────────────
# Step 1: 모델 접근 권한 확인
# ─────────────────────────────────────────────

def check_model_access():
    try:
        from huggingface_hub import model_info
        info = model_info(BASE_MODEL_HF)
        print(f"✅ 모델 접근 가능: {BASE_MODEL_HF}")
        return True
    except Exception as e:
        if "gated" in str(e).lower() or "403" in str(e):
            print(f"⛔ 모델 접근 권한 없음: {BASE_MODEL_HF}")
            print(f"   → 아래 링크에서 접근 신청 필요:")
            print(f"   → https://huggingface.co/{BASE_MODEL_HF}")
            sys.exit(1)
        raise


# ─────────────────────────────────────────────
# Step 2: LoRA 파인튜닝 (unsloth)
# ─────────────────────────────────────────────

def train(model_key):
    cfg = MODELS[model_key]
    print(f"\n🚀 [{model_key}] LoRA 파인튜닝 시작!")

    try:
        from unsloth import FastModel
        USE_UNSLOTH = True
    except ImportError:
        USE_UNSLOTH = False
        print("⚠️  unsloth 없음 → 일반 transformers 사용")

    import torch
    from datasets import Dataset
    from peft import LoraConfig, get_peft_model, TaskType
    from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
    from trl import SFTTrainer

    # 토크나이저
    print("⏳ 토크나이저 로드...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_HF)
    tokenizer.pad_token = tokenizer.eos_token

    # 데이터셋
    raw = [json.loads(l) for l in open(cfg["data"], encoding="utf-8")]
    texts = [
        tokenizer.apply_chat_template(s["messages"], tokenize=False, add_generation_prompt=False)
        for s in raw
    ]
    dataset = Dataset.from_dict({"text": texts})
    print(f"✅ 데이터: {len(dataset)}개 샘플")

    # 모델
    print("⏳ 모델 로드 중 (처음엔 다운로드, 약 8~10GB)...")
    device_map = "mps" if torch.backends.mps.is_available() else "auto"

    if USE_UNSLOTH:
        model, tokenizer = FastModel.from_pretrained(
            model_name=BASE_MODEL_HF,
            max_seq_length=2048,
            load_in_4bit=True,
        )
        model = FastModel.get_peft_model(
            model,
            r=16,
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
            lora_alpha=16,
            lora_dropout=0,
            bias="none",
        )
    else:
        model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL_HF,
            torch_dtype=torch.bfloat16,
            device_map=device_map,
        )
        lora_cfg = LoraConfig(
            task_type=TaskType.CAUSAL_LM,
            r=16,
            lora_alpha=16,
            lora_dropout=0.05,
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
        )
        model = get_peft_model(model, lora_cfg)

    model.print_trainable_parameters()

    # 학습
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=2048,
        args=TrainingArguments(
            output_dir=cfg["output"],
            per_device_train_batch_size=1,
            gradient_accumulation_steps=8,
            num_train_epochs=3,
            learning_rate=2e-4,
            bf16=torch.backends.mps.is_available(),
            logging_steps=5,
            save_strategy="epoch",
            optim="adamw_torch",
            report_to="none",
        ),
    )

    print("\n🏋️  학습 시작!")
    trainer.train()
    trainer.save_model(cfg["output"])
    tokenizer.save_pretrained(cfg["output"])
    print(f"✅ LoRA 가중치 저장: {cfg['output']}")

    return cfg


# ─────────────────────────────────────────────
# Step 3: GGUF 변환
# ─────────────────────────────────────────────

def convert_to_gguf(cfg):
    print(f"\n🔄 GGUF 변환 중...")

    # LoRA 머지 먼저
    merged_path = cfg["output"] + "_merged"
    print(f"   LoRA 머지: {merged_path}")

    import torch
    from peft import AutoPeftModelForCausalLM
    from transformers import AutoTokenizer

    model = AutoPeftModelForCausalLM.from_pretrained(
        cfg["output"],
        torch_dtype=torch.bfloat16,
        device_map="cpu",
    )
    model = model.merge_and_unload()
    model.save_pretrained(merged_path)
    AutoTokenizer.from_pretrained(cfg["output"]).save_pretrained(merged_path)
    print(f"✅ 머지 완료: {merged_path}")

    # llama.cpp 변환
    gguf_path = f"{cfg['output']}/{cfg['gguf_name']}"
    convert_script = os.path.expanduser("~/.claude/llama.cpp/convert_hf_to_gguf.py")

    if not os.path.exists(convert_script):
        print("⚠️  llama.cpp 없음 → 설치 방법:")
        print("   git clone https://github.com/ggerganov/llama.cpp ~/.claude/llama.cpp")
        print("   pip install -r ~/.claude/llama.cpp/requirements.txt")
        print(f"\n   설치 후 수동 실행:")
        print(f"   python3 {convert_script} {merged_path} --outfile {gguf_path} --outtype q4_k_m")
        return gguf_path

    subprocess.run([
        sys.executable, convert_script,
        merged_path,
        "--outfile", gguf_path,
        "--outtype", "q4_k_m",
    ], check=True)

    print(f"✅ GGUF 변환 완료: {gguf_path}")
    return gguf_path


# ─────────────────────────────────────────────
# Step 4: Ollama 탑재
# ─────────────────────────────────────────────

def create_ollama_model(cfg, gguf_path):
    print(f"\n🐝 Ollama 탑재: {cfg['ollama_name']}")

    modelfile_path = f"{cfg['output']}/Modelfile"
    modelfile_content = f"""FROM {os.path.abspath(gguf_path)}

SYSTEM \"\"\"{cfg['system']}\"\"\"

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 4096
"""
    with open(modelfile_path, "w") as f:
        f.write(modelfile_content)

    result = subprocess.run(
        ["ollama", "create", cfg["ollama_name"], "-f", modelfile_path],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        print(f"✅ Ollama 모델 생성: {cfg['ollama_name']}")
    else:
        print(f"❌ Ollama 에러: {result.stderr}")


# ─────────────────────────────────────────────
# 메인
# ─────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", choices=["jaembbong", "beeliber-bee", "all"], default="all")
    parser.add_argument("--skip-train", action="store_true", help="학습 건너뛰고 GGUF 변환만")
    args = parser.parse_args()

    check_hf_login()
    check_model_access()

    targets = list(MODELS.keys()) if args.model == "all" else [args.model]

    for key in targets:
        cfg = MODELS[key]
        if not args.skip_train:
            cfg = train(key)
        gguf_path = convert_to_gguf(cfg)
        create_ollama_model(cfg, gguf_path)

    print("\n🎉 전체 파이프라인 완료!")
    print("테스트: python3 gemma_chat.py")
