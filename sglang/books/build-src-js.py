#!/usr/bin/env python3
"""从 sglang 源码仓库抽取书中引用的代码段，生成 assets/sglang-src.js。
键 = 「相对 python/sglang/srt 的路径:起[-止]」；值 = 该行范围原文（\n 连接）。
书中正文引用用短名/相对名，这里统一为真实仓库路径（相对 srt，根外的前缀补全）。
"""
import json
import re
import subprocess
import sys
from pathlib import Path

BOOKS = Path(__file__).parent
REPO = Path("/Users/lei.xia/workspace/github/sglang")
SRT = REPO / "python/sglang/srt"

# 书中写法 -> 仓库真实路径（相对 SRT；None 表示相对仓库根）
PATH_MAP = {
    "allocation.py": "mem_cache/allocation.py",
    "arg_groups/fields/disagg.py": "arg_groups/fields/disagg.py",
    "arg_groups/fields/serving.py": "arg_groups/fields/serving.py",
    "arg_groups/model_hook.py": "arg_groups/model_hook.py",
    "arg_groups/parallel_hook.py": "arg_groups/parallel_hook.py",
    "base/conn.py": "disaggregation/base/conn.py",
    "batch_result_processor.py": "managers/scheduler_components/batch_result_processor.py",
    "components/base.py": "mem_cache/unified_cache/components/base.py",
    "conn.py": "disaggregation/mooncake/conn.py",
    "contracts.py": "layers/layer_boundary/contracts.py",
    "decode.py": "disaggregation/decode.py",
    "disagg.py": "arg_groups/fields/disagg.py",
    "disaggregation/decode.py": "disaggregation/decode.py",
    "disaggregation/prefill.py": "disaggregation/prefill.py",
    "distributed/parallel_state.py": "distributed/parallel_state.py",
    "dllm/algorithm/base.py": "dllm/algorithm/base.py",
    "dllm/mixin/scheduler.py": "dllm/mixin/scheduler.py",
    "eagle_utils.py": "speculative/eagle_utils.py",
    "eagle_worker_common.py": "speculative/eagle_worker_common.py",
    "eagle_worker_v2.py": "speculative/eagle_worker_v2.py",
    "engine.py": "entrypoints/engine.py",
    "environ.py": "environ.py",
    "evict_policy.py": "mem_cache/evict_policy.py",
    "flashinfer_backend.py": "layers/attention/flashinfer_backend.py",
    "forward_batch_info.py": "model_executor/forward_batch_info.py",
    "hicache_storage.py": "mem_cache/hicache_storage.py",
    "http_server.py": "entrypoints/http_server.py",
    "io_struct.py": "managers/io_struct.py",
    "kv_cache_hook.py": "arg_groups/kv_cache_hook.py",
    "layers/logits_processor.py": "layers/logits_processor.py",
    "lilicorr_utils.py": "speculative/lilicorr_utils.py",
    "lmcache_unified_radix_cache.py": "mem_cache/storage/lmcache/lmcache_unified_radix_cache.py",
    "loader.py": "model_loader/loader.py",
    "mamba.py": "mem_cache/unified_cache/components/mamba.py",
    "mem_cache/allocation.py": "mem_cache/allocation.py",
    "mem_cache/allocator/paged.py": "mem_cache/allocator/paged.py",
    "mem_cache/storage/tensorcast_store/tensorcast_store.py": "mem_cache/storage/tensorcast_store/tensorcast_store.py",
    "memory.py": "arg_groups/fields/memory.py",
    "outlines_backend.py": "constrained/outlines_backend.py",
    "output_streamer.py": "managers/scheduler_components/output_streamer.py",
    "pool_host/mha.py": "mem_cache/pool_host/mha.py",
    "prefill.py": "disaggregation/prefill.py",
    "protocol.py": "entrypoints/openai/protocol.py",
    "radix_cache.py": "mem_cache/radix_cache.py",
    "registry.py": "mem_cache/registry.py",
    "runtime_context.py": "runtime_context.py",
    "sampler.py": "layers/sampler.py",
    "sampling_batch_info.py": "sampling/sampling_batch_info.py",
    "sampling_mask.py": "sampling/sampling_mask.py",
    "schedule_batch.py": "managers/schedule_batch.py",
    "schedule_policy.py": "managers/schedule_policy.py",
    "scheduler.py": "managers/scheduler.py",
    "serving_chat.py": "entrypoints/openai/serving_chat.py",
    "sglang/kernels/ops/memory/allocator.py": "python/sglang/kernels/ops/memory/allocator.py",  # 相对仓库根
    "systemone/serving.py": "entrypoints/systemone/serving.py",
    "tokenizer_manager.py": "managers/tokenizer_manager.py",
    "tp_worker.py": "managers/tp_worker.py",
    "tree_core_registry.py": "mem_cache/unified_cache/tree_core_registry.py",
    "unified_radix_cache.py": "mem_cache/unified_radix_cache.py",
    "unified_tree_core.py": "mem_cache/unified_cache/unified_tree_core.py",
    "weight_updater.py": "managers/scheduler_components/weight_updater.py",
    "xgrammar_backend.py": "constrained/xgrammar_backend.py",
}

PIN_RE = re.compile(r'([A-Za-z_0-9/.\-]+\.py):(\d+)(?:-(\d+))?')


def collect_pins():
    """(html_file, line_no, short_path, lo, hi) 列表；去重键 = (short_path, lo, hi)。"""
    pins = {}
    for html in sorted(BOOKS.glob("*.html")):
        for lineno, line in enumerate(html.read_text(encoding="utf-8").splitlines(), 1):
            for m in PIN_RE.finditer(line):
                short, lo, hi = m.group(1), int(m.group(2)), int(m.group(3) or 0)
                key = (short, lo, hi)
                pins.setdefault(key, []).append((html.name, lineno))
    return pins


def resolve(short: str) -> Path:
    if short in PATH_MAP:
        rel = PATH_MAP[short]
        if rel is None:
            return REPO / short  # 相对仓库根
        if rel.startswith("python/"):
            return REPO / rel
        return SRT / rel
    # 已带目录前缀且能直接命中
    p = SRT / short
    if p.exists():
        return p
    # srt 下同名唯一文件
    out = subprocess.run(["find", str(SRT), "-name", short, "-type", "f"],
                         capture_output=True, text=True).stdout.split()
    if len(out) == 1:
        return Path(out[0])
    if len(out) > 1:
        # 按前缀目录取唯一匹配
        prefix = short.split("/")[0]
        narrowed = [o for o in out if f"/{prefix}/" in o]
        if len(narrowed) == 1:
            return Path(narrowed[0])
        print(f"AMBIGUOUS {short}: {out}", file=sys.stderr)
        raise SystemExit(1)
    p2 = REPO / short
    if p2.exists():
        return p2
    print(f"NOT FOUND {short}", file=sys.stderr)
    raise SystemExit(1)


def main():
    pins = collect_pins()
    print(f"{len(pins)} unique pins")
    data = {}
    for (short, lo, hi), where in sorted(pins.items()):
        path = resolve(short)
        src = path.read_text(encoding="utf-8", errors="replace").splitlines()
        if not (1 <= lo <= len(src)):
            print(f"BAD LINE {short}:{lo} ({len(src)} lines) — {where}", file=sys.stderr)
            raise SystemExit(1)
        end = hi if hi >= lo else lo
        if end > len(src):
            print(f"BAD RANGE {short}:{lo}-{hi} > {len(src)} — {where}", file=sys.stderr)
            raise SystemExit(1)
        data[f"{short}:{lo}" + (f"-{hi}" if hi > lo else "")] = "\n".join(src[lo - 1:end])
    head = (
        "/* sglang/books 源码悬浮数据 — 锚定 sgl-project/sglang gateway-v0.3.1-10329-g2ff52e3ceb"
        " (2026-09-29 快照)。\n"
        "   由工具脚本 build-src-js.py 从源码仓库自动抽取；键为「文件:起[-止]」行号（相对"
        " python/sglang/srt），值为该范围原文。\n"
        "   读者交互：正文中带虚线下划线的文件名/符号，鼠标悬浮显示对应源码段落。 */\n"
        "window.SglangSrc = {\n"
    )
    body = "".join(
        f"{json.dumps(k, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False)},\n"
        for k, v in data.items()
    )
    out = BOOKS / "assets" / "sglang-src.js"
    out.write_text(head + body[:-2] + "\n};\n", encoding="utf-8")
    print(f"wrote {out} ({len(data)} keys)")


if __name__ == "__main__":
    main()
