# Architectural Design Specification: HA-TFF

## 1. Physical Constraints and the 100GbE Bottleneck
The fundamental architectural driver for the Hardware-Accelerated Telemetry Firewall (HA-TFF) is the 6.72 nanosecond inter-packet arrival time inherent to 100 Gigabit Ethernet (100GbE) operating at line rate with minimum-size (64-byte) frames. General-purpose CPUs, even with high-end DPDK frameworks, suffer from context-switching and memory-access latencies that far exceed this budget.

## 2. AXI4-Stream parsing and the 512-bit Data Bus
To meet the latency requirement, HA-TFF relies on a 512-bit wide AXI4-Stream data bus. This width is deliberate: a standard IPv4/TCP header stack fits within 42 bytes (336 bits). Therefore, the entire critical header payload is guaranteed to arrive on the first clock edge of the transaction.

This permits a purely combinatorial parsing approach in `ha_tff_parser.v`. Rather than utilizing a state machine to step through the packet byte-by-byte, the 104-bit 5-tuple (Source IP, Dest IP, Source Port, Dest Port, Protocol) is extracted using direct wire routing on the first cycle.

## 3. Cryptographic Hashing and Cuckoo Collision Resolution
Once extracted, the 104-bit tuple is passed to `ha_tff_hash.v`. A naive TCAM (Ternary Content-Addressable Memory) approach was rejected due to excessive power consumption and high cost on mid-range FPGAs. Conversely, a distributed LUTRAM linked-list hash table fails the bounded timing constraints required for line-rate processing.

Instead, HA-TFF utilizes **Cuckoo Hashing**:
1. A Keyed XOR-Fold hashing algorithm maps the 104-bit tuple to four independent 12-bit addresses.
2. These addresses index four parallel XPM BRAM blocks (`ha_tff_bram_bank.v`).
3. The four resulting 128-bit records are evaluated simultaneously in `ha_tff_matcher.v` against the extracted tuple.

This guarantees `O(1)` lookup latency at the cost of dedicating 48 BRAM blocks. The use of a 128-bit runtime secret key ensures the hashing distribution resists hash-flooding algorithmic complexity attacks.

## 4. Pipeline Synchronization and Telemetry
The core datapath operates on a strict 16-cycle delay line (`axi_stream_delay_line.v`). While the parser and hash tables require 16 cycles to compute the firewall rule assertion (pass/drop), the original 512-bit AXI4-Stream packet is shifted through a parallel FIFO. The mathematical assertion of the exact-match decision arrives precisely aligned with the first word of the delayed payload.

Telemetry (stalls, dropped bytes) is collected via `ha_tff_performance_monitor.v` in zero-latency by tapping into the AXI handshaking signals (`tvalid`, `tready`), ensuring observability without impacting the critical path to the output MAC.

## 5. Timing Closure
The RTL was explicitly designed without relying on dedicated DSP slices, ensuring the multiplication and folding steps fit cleanly into standard CLB structures. Pipelined registers isolate the deep combinatorial paths of the XOR-Folding hash, resulting in successful timing closure at 156.25 MHz (6.4ns) on Xilinx Artix-7 fabric.
