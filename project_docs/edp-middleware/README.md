# EDP Middleware (Meghadut)

## 1. What It Is
The Embedded Design Platform (EDP) is an application-agnostic, zero-copy Inter-Process Communication (IPC) middleware written in C11. It is designed to act as the foundational data plane for cyber-physical systems (like drones and robotic platforms), separating hard real-time hardware transport from higher-level application logic.

## 2. The Architecture
```mermaid
flowchart TD
    subgraph Hardware Layer
    UART[UART]
    SPI[SPI]
    UDP[UDP Sockets]
    end
    
    subgraph EDP Core (Middleware)
    T[Transport Abstraction]
    P[Protocol Plugins: e.g. MAVLink]
    I[Zero-Copy IPC Bridge]
    end
    
    subgraph User Space
    M[Meghadut Daemon]
    end
    
    UART --> T
    SPI --> T
    UDP --> T
    T --> P
    P --> I
    I --> M
```

EDP is compiled as a static library (`edp_core.a`). It abstracts the hardware interfaces into a unified transport layer, parses incoming packets using application-agnostic protocol plugins, and routes pointers via a zero-copy shared memory IPC bridge to the user-space daemon.

## 3. Key Features
- **Zero-Copy IPC:** Utilizes highly optimized ring buffers to pass memory pointers across process boundaries instead of copying payloads.
- **Lock-Free Concurrency:** Replaces standard POSIX mutexes with C11 atomics in the hot path to eliminate context-switching overhead.
- **Protocol Polymorphism in C:** Achieves application-agnostic behavior without the overhead of C++ virtual table (`vtable`) lookups by using static function pointers and compiler definitions.

## 4. Performance Results
- **Memory Allocation:** Guarantees `O(1)` deterministic allocation times. Zero dynamic allocation on the hot path.
- **IPC Latency:** Outperforms standard POSIX socket-based IPC by eliminating the `memcpy()` overhead inherent to monolithic software stacks.

## 5. How to Reproduce
```bash
git clone https://github.com/Ganeshkumara26/edp-middleware.git
cd edp-middleware
mkdir build && cd build
cmake -DEDP_BUILD_PROTOCOL_MAVLINK=ON ..
make
```
