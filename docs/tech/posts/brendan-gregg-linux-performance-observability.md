---
title: Brendan Gregg's Linux Performance Observability & Tracing Blueprint
created: 2026-11-05
description: A complete blueprint for Linux performance analysis - the USE Method, the 60-second triage checklist, off-CPU profiling, and SVG flame graph generation.
categories:
  - practice
slug: brendan-gregg-linux-performance-observability
comments: true
---

## Brendan Gregg's Linux Performance Observability & Tracing Blueprint

When a production system experiences sudden latency spikes, degraded throughput, or mysterious stalls, engineers often resort to reactive anti-patterns: blindly guessing configurations, rebooting instances, or staring at misleading CPU utilization percentages.

**Brendan Gregg** transformed modern systems engineering by replacing intuition and folklore with rigorous, hypothesis-driven methodology. Grounded in his classic [Linux Performance](http://www.brendangregg.com/linuxperf.html) research at Sun Microsystems, Netflix, and Intel, systems performance is treated as a science governed by queues, utilization bounds, and kernel event instrumentation.

This guide synthesizes Brendan Gregg's foundational performance methodology: the **USE Method**, the **60-Second Triage Checklist**, **Off-CPU Analysis**, and **Interactive Flame Graphs**.

---

### 1. The Linux Performance Observability Tools Map

The Linux kernel is a layered machine. Every user-space request passes through system calls, the Virtual File System (VFS), the scheduler, virtual memory, and physical device drivers.

Brendan Gregg's iconic **Linux Performance Observability Tools** diagram maps standard and specialized inspection tools directly to their respective kernel subsystems:

![Brendan Gregg's Linux Performance Observability Tools Map](/assets/images/perf/linux_observability_tools.png)

#### Subsystem Observability Breakdown

Observability tools should always be selected by **subsystem boundary**, not by personal familiarity:

| Subsystem Layer | Kernel Boundary & Scope | Classic CLI Tools | Modern eBPF / BPFtrace Tools | Primary Metrics & Focus |
|---|---|---|---|---|
| **Applications & Runtimes** | User-space bytecode/native execution (JVM, Node, Python, Go, C++) | `top`, `pidstat`, `jstack`, `pstack`, `gdb` | `profile`, `usdt`, `py-spy`, `async-profiler` | On-CPU execution hotspots, thread state, garbage collection stalls |
| **System Libraries** | User-space heap allocators & runtime libraries (`glibc`, `jemalloc`, `pthreads`) | `ltrace`, `malloc_stats`, `valgrind` | `memleak`, `malloccost`, `uthreads` | Heap fragmentation, lock hold times, allocation latency |
| **System Call Interface** | Boundary transition between user mode and kernel ring 0 | `strace`, `perf trace`, `time -v` | `syscount`, `bpftrace` (`sys_enter` tracepoints) | System call rate, syscall error codes, time spent in kernel mode (`%sys`) |
| **VFS & File Systems** | File descriptors, dentry cache, inode resolution (`ext4`, `xfs`, `btrfs`) | `lsof`, `fuser`, `df -h`, `sar -v` | `opensnoop`, `filelife`, `fileslower`, `vfsstat`, `ext4dist` | File open latency, slow reads/writes, dentry/inode cache churn |
| **Page Cache & Virtual Memory** | Page frames, swap partitions, `kswapd0` reclamation, slab caches | `free -m`, `vmstat 1`, `slabtop`, `swapon -s` | `memleak`, `cachestat`, `oomkill`, `swapin` | Page cache hit ratios, dirty writeback stalls, swap-in/swap-out rates (`si`/`so`) |
| **CPU Scheduler & Sched** | Completely Fair Scheduler (CFS), runqueues, voluntary/involuntary switches | `uptime`, `mpstat -P ALL 1`, `pidstat -w 1` | `runqlat`, `runqlen`, `cpudist`, `offcputime` | Runqueue latency, scheduling delays, context switch frequency |
| **Block Layer & Storage** | I/O queues, `blk-mq`, request merging, disk device drivers (NVMe, SATA) | `iostat -xz 1`, `iotop`, `blktrace` | `biolatency`, `biosnoop`, `bitesize` | Average wait time (`await`), queue size (`aqu-sz`), device saturation (`%util`) |
| **Network Protocol Stack** | TCP/IP engine, socket buffers (`sk_buff`), connection tracking (`conntrack`) | `ss -s`, `netstat -s`, `ip -s link`, `sar -n DEV,TCP` | `tcpconnect`, `tcpretrans`, `tcpdrop`, `tcplife` | TCP retransmissions, socket buffer drops, connection setup latency |
| **Device Drivers & Hardware** | PCIe bus, network PHY, memory buses, CPU hardware performance counters | `ethtool -S`, `lspci -v`, `perf stat` | `hardirqs`, `softirqs`, `llcstat` (cache misses) | Hardware CRC errors, DMA overruns, CPU instructions per cycle (IPC) |

---

### 2. The USE Method: Utilization, Saturation, and Errors

The **USE Method** (Utilization, Saturation, and Errors) is an exhaustive checklist designed to identify system bottlenecks systematically:

> **For every resource (CPU, memory, storage device, network interface, bus), check:**
>
> 1. **Utilization**: The percentage of time the resource was busy servicing work.
> 2. **Saturation**: The degree to which extra work queued waiting for the resource.
> 3. **Errors**: The count of error events.

<Archify src="./diagrams/brendan-gregg-use-method.workflow.json" />

#### The Physical Resource Matrix

| Resource | Utilization Metric | Saturation Metric | Error Metric |
|---|---|---|---|
| **CPU Core** | `mpstat -P ALL` (`%usr` + `%sys`) | `runqlat` (queue latency), loadavg > CPU count | CPU thermal throttling (`mcelog`, `dmesg`) |
| **Memory** | `free -m` (used / total) | Swapping rate (`vmstat` `si`/`so`), `kswapd0` activity | OOM killer invocations (`dmesg`), allocation failures |
| **Storage Device** | `iostat -xz 1` (`%util`) | `iostat` `aqu-sz` (queue length), `await` $\gg$ `svctm` | Device I/O errors (`/sys/block/*/stat`, `dmesg`) |
| **Network Interface** | `sar -n DEV 1` (rxkB/s / bandwidth) | Output queue drops (`ifconfig` `overruns`, `txqueuelen`) | CRC errors, frame errors, `drop` counters |
| **Storage Controller** | Controller IOPS vs vendor spec | Pending request queue slots | PCIe AER bus errors, controller resets |

#### Why Utilization Alone Is Dangerous

High utilization is not necessarily bad: a system operating at 85% CPU utilization with zero queueing (saturation) can service requests with optimal sub-millisecond latencies.

Conversely, a system at 30% average CPU utilization can experience devastating 10-second latency spikes if **saturation** occurs on a single shared mutex or when threads block in uninterruptible disk wait (`D` state). **Saturation measures queueing delay, and queueing delay drives latency.**

---

### 3. The 60-Second Triage Playbook

Developed by Brendan Gregg and the performance engineering team at Netflix, the **60-Second Linux Performance Triage** executes ten commands in sequence to capture system state:

```bash
# 1. Check load average and running tasks across 1, 5, and 15 minute windows
uptime

# 2. Inspect kernel ring buffer for hardware faults, OOMs, or TCP drops
dmesg -T | tail -n 50

# 3. Check runqueue (r), blocked (b), swap in/out (si/so), and CPU breakdown
vmstat 1 5

# 4. Check per-CPU utilization to identify single-core bottlenecks or imbalance
mpstat -P ALL 1 2

# 5. Identify top processes consuming user and system CPU
pidstat 1 3

# 6. Check disk utilization (%util), queue size (aqu-sz), and latency (await)
iostat -xz 1 3

# 7. Check available memory, buffers, and page cache
free -m

# 8. Check network throughput (rxpck/s, txpck/s, rxkB/s, txkB/s)
sar -n DEV 1 3

# 9. Check TCP connection rates (active/s, passive/s) and retransmits (retrans/s)
sar -n TCP,ETCP 1 3

# 10. High-level process overview and thread count inspection
top
```

#### Interpreting the First 60 Seconds

- If `loadavg` $\gg$ CPU cores and `vmstat` column `b` (blocked) is high: Threads are blocked in uninterruptible I/O sleep (`D` state). Jump immediately to `iostat` and `dmesg`.
- If `vmstat` column `si` / `so` (swap-in/swap-out) is non-zero: The system has run out of physical memory and is thrashing against swap disk.
- If `sar -n ETCP` shows non-zero `retrans/s`: Network packets are being dropped by switches or receiving ring buffers, inducing TCP exponential backoff.

---

### 4. On-CPU vs Off-CPU Latency Analysis

Standard profilers (such as Linux `perf record`, Java async-profiler, or Python cProfile) sample the CPU instruction pointer periodically (e.g. at 99 Hz).

If an application request takes 200 milliseconds to complete:

- 10 milliseconds are spent computing JSON parsing and business logic (**On-CPU**).
- 190 milliseconds are spent waiting for a database socket response, a file `fsync`, or a mutex lock (**Off-CPU**).

```text
Request Timeline (200 ms total latency):
[ On-CPU: 5ms ]──[ Off-CPU Wait: Lock (45ms) ]──[ Off-CPU Wait: DB Socket (145ms) ]──[ On-CPU: 5ms ]
▲                                                                                     ▲
│◄─────────────────────── Visible to Standard CPU Profiler: 10ms (5%) ───────────────►│
│◄─────────────────────── Invisible to CPU Profiler (Off-CPU): 190ms (95%) ───────────►│
```

A standard CPU profiler samples only when the CPU is running instructions. It is **completely blind to the 190 milliseconds where the thread was sleeping!**

#### Tracing Off-CPU Time with eBPF

Using eBPF (`bpftrace` or BCC's `offcputime`), the kernel instruments the scheduler context-switch event (`finish_task_switch`):

1. When a thread is switched out, record the timestamp:

   ```c
   start[prev_pid] = bpf_ktime_get_ns();
   ```

2. When the thread is switched back in, compute elapsed duration:

   ```c
   delta = bpf_ktime_get_ns() - start[curr_pid];
   @off_cpu_time[stack_id] += delta;
   ```

3. Group off-CPU durations by user/kernel call stack to pinpoint the exact line of code waiting on a lock or socket.

Brendan Gregg's BPFtrace observability map summarizes the modern eBPF tracing arsenal across kernel probes, tracepoints, and socket filters:

![Brendan Gregg's Linux BPFtrace Observability Tools](/assets/images/perf/linux_bpftrace_tools.png)

---

### 5. Flame Graph Anatomy & Representation

Invented by Brendan Gregg in 2011, **Flame Graphs** visualize sampled profiling data hierarchically:

```text
+-------------------------------------------------------------------------+
|                       handle_request (100% width)                       |
+-----------------------------------+-------------------------------------+
|      parse_json (30% width)       |       execute_query (70% width)     |
+-----------------+-----------------+-------------------+-----------------+
| tokenize (15%)  | build_ast (15%) | socket_read (50%) | unpack_row (20%)|
+-----------------+-----------------+-------------------+-----------------+
```

#### Key Properties of Flame Graphs

- **X-axis (Alphabetical, not chronological)**: The horizontal axis spans the entire sample population. Stacks are sorted alphabetically to merge identical code paths into wide, contiguous rectangles.
- **Y-axis (Stack Depth)**: The vertical axis represents stack depth (bottom is root caller, top is leaf function).
- **Width**: The width of each rectangle is directly proportional to the percentage of time that function was present in the profile.
- **Color**: Colors are randomized warm palettes (red/orange/yellow for CPU, blue/cyan for Off-CPU, green for memory) designed to visually delineate adjacent frames.

#### The Folded Stack Format

Before rendering an SVG flame graph, raw profiler output is aggregated into the canonical **folded stack format**:

```text
main;server_loop;handle_request;parse_json 150
main;server_loop;handle_request;execute_query;socket_read 500
main;server_loop;handle_request;execute_query;unpack_row 200
```

Each line represents a unique call chain separated by semicolons, followed by the sample count.

---

### 6. Verification Lab: Stack Trace Collapser & SVG Flame Graph Generator

The following self-contained Python lab implements:

1. A **Folded Stack Aggregator**: Simulates raw stack trace samples and collapses identical call trees into canonical folded records.
2. A **Flame Graph Tree Node Generator**: Converts flat folded stack strings into a hierarchical tree with computed fractional widths and pixel offsets.
3. An **Interactive SVG Renderer**: Generates a valid SVG flame graph document with embedded CSS tooltips, verifying correct layout arithmetic with unit assertions.

```python
"""
Brendan Gregg Linux Performance Lab: Stack Collapser & Flame Graph SVG Generator
Tests folded stack aggregation, tree layout calculation, and interactive SVG generation.
"""

from typing import List, Dict, Tuple, Optional
import xml.etree.ElementTree as ET

class StackSample:
    def __init__(self, stack: List[str], count: int = 1):
        self.stack = stack
        self.count = count

class StackCollapser:
    def __init__(self):
        self.counts: Dict[str, int] = {}

    def add_sample(self, frames: List[str], count: int = 1):
        folded_key = ";".join(frames)
        self.counts[folded_key] = self.counts.get(folded_key, 0) + count

    def get_folded_lines(self) -> List[Tuple[str, int]]:
        return sorted(self.counts.items())

class FlameNode:
    def __init__(self, name: str):
        self.name = name
        self.value = 0
        self.children: Dict[str, 'FlameNode'] = {}
        # Layout properties
        self.x = 0.0
        self.width = 0.0
        self.depth = 0

    def add_call(self, frames: List[str], count: int):
        self.value += count
        if not frames:
            return
        head, *tail = frames
        if head not in self.children:
            self.children[head] = FlameNode(head)
        self.children[head].add_call(tail, count)

class FlameGraphGenerator:
    CANVAS_WIDTH = 1200
    ROW_HEIGHT = 20

    def __init__(self, root: FlameNode):
        self.root = root
        self.max_depth = 0
        self.layout_nodes: List[FlameNode] = []

    def compute_layout(self):
        self.max_depth = 0
        self.layout_nodes.clear()
        self._layout_recursive(self.root, x=0.0, depth=0)

    def _layout_recursive(self, node: FlameNode, x: float, depth: int):
        node.x = x
        node.depth = depth
        if depth > self.max_depth:
            self.max_depth = depth
        if self.root.value > 0:
            node.width = (node.value / self.root.value) * self.CANVAS_WIDTH
        else:
            node.width = 0.0

        if depth > 0:  # Don't include virtual root in render nodes
            self.layout_nodes.append(node)

        child_x = x
        # Sort children alphabetically for canonical flame graph layout
        for child_name in sorted(node.children.keys()):
            child = node.children[child_name]
            self._layout_recursive(child, child_x, depth + 1)
            child_x += child.width

    def generate_svg(self) -> str:
        self.compute_layout()
        total_height = (self.max_depth + 1) * self.ROW_HEIGHT + 40

        svg_lines = [
            f'<svg version="1.1" width="{self.CANVAS_WIDTH}" height="{total_height}" '
            f'xmlns="http://www.w3.org/2000/svg" style="font-family: monospace; font-size: 11px;">',
            '<style>',
            '  rect { stroke: #ffffff; stroke-width: 0.5px; opacity: 0.9; }',
            '  rect:hover { stroke: #000000; stroke-width: 1px; opacity: 1.0; cursor: pointer; }',
            '  text { fill: #222222; pointer-events: none; }',
            '</style>',
            f'<rect x="0" y="0" width="{self.CANVAS_WIDTH}" height="{total_height}" fill="#f8f9fa"/>'
        ]

        # Colors: deterministic hashing for flame warmth
        palette = ["#f87171", "#fb923c", "#facc15", "#f43f5e", "#ea580c"]

        for node in self.layout_nodes:
            # Y is inverted (depth 1 at bottom, deeper stacks higher up)
            y = total_height - (node.depth * self.ROW_HEIGHT) - 20
            color = palette[hash(node.name) % len(palette)]
            percent = (node.value / self.root.value) * 100.0 if self.root.value else 0.0

            title_text = f"{node.name} ({node.value} samples, {percent:.1f}%)"
            svg_lines.append(
                f'<g><title>{title_text}</title>'
                f'<rect x="{node.x:.2f}" y="{y:.2f}" width="{node.width:.2f}" height="{self.ROW_HEIGHT}" fill="{color}"/>'
            )
            # Only render text label if box is wide enough (> 35px)
            if node.width > 35:
                svg_lines.append(
                    f'<text x="{node.x + 3:.2f}" y="{y + 14:.2f}">{node.name[:int(node.width // 7)]}</text>'
                )
            svg_lines.append('</g>')

        svg_lines.append('</svg>')
        return "\n".join(svg_lines)

def run_lab():
    # -------------------------------------------------------------
    # 1. Simulate Raw Stack Samples
    # -------------------------------------------------------------
    collapser = StackCollapser()
    # Scenario: Web request processing
    # Path A: 300 samples in parse_json
    collapser.add_sample(["all", "server_loop", "handle_req", "parse_json"], 300)
    # Path B: 500 samples in execute_query -> socket_read (DB wait)
    collapser.add_sample(["all", "server_loop", "handle_req", "execute_query", "socket_read"], 500)
    # Path C: 200 samples in execute_query -> unpack_rows
    collapser.add_sample(["all", "server_loop", "handle_req", "execute_query", "unpack_rows"], 200)

    folded = collapser.get_folded_lines()
    assert len(folded) == 3
    assert folded[0] == ("all;server_loop;handle_req;execute_query;socket_read", 500)
    assert folded[1] == ("all;server_loop;handle_req;execute_query;unpack_rows", 200)
    assert folded[2] == ("all;server_loop;handle_req;parse_json", 300)

    # -------------------------------------------------------------
    # 2. Build Hierarchical Flame Graph Tree
    # -------------------------------------------------------------
    root = FlameNode("root")
    total_samples = 0
    for line, count in folded:
        frames = line.split(";")
        root.add_call(frames, count)
        total_samples += count

    assert root.value == 1000
    assert "all" in root.children
    all_node = root.children["all"]
    assert all_node.value == 1000

    # -------------------------------------------------------------
    # 3. Compute Layout & Verify Geometric Constraints
    # -------------------------------------------------------------
    generator = FlameGraphGenerator(root)
    generator.compute_layout()

    # Total width must match canvas exactly (1200px)
    assert round(all_node.width, 2) == 1200.0

    handle_req_node = all_node.children["server_loop"].children["handle_req"]
    assert handle_req_node.value == 1000

    parse_json_node = handle_req_node.children["parse_json"]
    execute_query_node = handle_req_node.children["execute_query"]

    # parse_json: 300/1000 = 30% width -> 360px
    assert round(parse_json_node.width, 1) == 360.0
    # execute_query: 700/1000 = 70% width -> 840px
    assert round(execute_query_node.width, 1) == 840.0

    # Layout continuity: parse_json starts after execute_query (alphabetical order)
    # 'execute_query' < 'parse_json', so execute_query is placed at x = 0, parse_json at x = 840
    assert round(execute_query_node.x, 1) == 0.0
    assert round(parse_json_node.x, 1) == 840.0
    assert round(execute_query_node.x + execute_query_node.width, 1) == round(parse_json_node.x, 1)

    # -------------------------------------------------------------
    # 4. Generate SVG & Validate XML Structure
    # -------------------------------------------------------------
    svg_output = generator.generate_svg()
    assert "<svg" in svg_output
    assert "</svg>" in svg_output

    # Parse with standard XML parser to verify syntax validity
    tree = ET.fromstring(svg_output)
    assert tree.tag.endswith("svg")
    rects = tree.findall(".//{http://www.w3.org/2000/svg}rect")
    # 1 background rect + 6 stack nodes (all, server_loop, handle_req, parse_json, execute_query, socket_read, unpack_rows)
    assert len(rects) >= 7

    print("Folded stack lines successfully aggregated:")
    for line, count in folded:
        print(f"  {line} -> {count}")
    print(f"Flame Graph layout verified: 1000 samples mapped onto {generator.CANVAS_WIDTH}px canvas")
    print(f"SVG validity confirmed: {len(rects)} rectangles rendered cleanly")
    print("Brendan Gregg Linux Performance Lab passed.")

if __name__ == "__main__":
    run_lab()
```

---

### 7. Primary References & Canonical Documentation

1. **Brendan Gregg's Linux Performance Portal**:
   - [Linux Performance](http://www.brendangregg.com/linuxperf.html) (Classic diagrams, slide decks, and reference guides).
   - [The USE Method: Computing Resource Checklist](http://www.brendangregg.com/usemethod.html).
   - [The USE Method: Linux Checklist](http://www.brendangregg.com/USEmethod/use-linux.html).
2. **Netflix Performance Engineering**:
   - [Linux Performance Analysis in 60,000 Milliseconds](https://netflixtechblog.com/linux-performance-analysis-in-60-000-milliseconds-accc10403c55) (Netflix Tech Blog).
   - [Linux Performance Analysis in 60s (ACM Queue PDF)](http://www.brendangregg.com/Articles/Netflix_Linux_Perf_Analysis_60s.pdf).
3. **Visualization & Tracing Foundations**:
   - [CPU Flame Graphs](http://www.brendangregg.com/flamegraphs.html) and [Off-CPU Flame Graphs](http://www.brendangregg.com/FlameGraphs/offcpuflamegraphs.html).
   - [BPF Performance Tools (Addison-Wesley Professional, 2019)](http://www.brendangregg.com/bpf-performance-tools-book.html).
   - [Systems Performance: Enterprise and the Cloud, 2nd Edition (Addison-Wesley Professional, 2020)](http://www.brendangregg.com/systems-performance-2nd-edition-book.html).
4. **Practical Linux Systems Debugging**:
   - Ni Pengfei, *Linux Performance Optimization in Practice*, Geektime.
