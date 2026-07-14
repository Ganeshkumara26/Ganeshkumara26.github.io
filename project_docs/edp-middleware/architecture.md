# Architectural Design Specification: EDP Middleware

## 1. The Monolithic Bottleneck in Cyber-Physical Systems
Historically, embedded robotic stacks (like legacy UAV firmware) tightly coupled hardware drivers (UART/SPI) with application-layer protocols (MAVLink, Custom Telemetry). This paradigm results in an `O(N^2)` scaling complexity when integrating new transport methods or new protocols. Furthermore, monolithic architectures rely heavily on moving raw payloads via `memcpy()` across internal boundaries, incurring massive latency penalties at high bandwidths on constrained ARM Cortex processors.

## 2. Interface Polymorphism in Pure C
To resolve the coupling bottleneck, the Embedded Design Platform (EDP) is designed as a middleware abstraction layer. Rather than using C++ and incurring the overhead of runtime virtual table (`vtable`) lookups, EDP utilizes static struct function pointers and CMake macro definitions to achieve polymorphism.

The core transport layer accepts abstract byte streams from any hardware driver (UART, UDP). The protocol parsing logic is injected at compile time (e.g., `EDP_BUILD_PROTOCOL_MAVLINK`). This allows the middleware to be strictly application-agnostic while retaining the extreme performance of purely static C11 execution.

## 3. Zero-Copy IPC and Shared Memory
The primary architectural innovation of the EDP Core is its Inter-Process Communication (IPC) bridge to the user-space daemon (Meghadut). 

When a packet is parsed from the transport layer, the payload is placed into a pre-allocated, deterministic memory block. Instead of copying this payload across the IPC boundary to the user space via traditional POSIX sockets or pipes, EDP passes a *pointer* to the memory block using a highly synchronized Ring Buffer.

## 4. Concurrency via Lock-Free Atomics
A shared memory ring buffer typically requires strict mutex synchronization to prevent race conditions between the producer (hardware interrupt) and the consumer (user daemon). However, standard POSIX mutexes force context switches into the kernel, ruining the deterministic real-time guarantees required for flight controllers.

EDP resolves this by replacing mutexes with **Lock-Free Atomics** (`stdatomic.h`). The read and write indices of the IPC ring buffers are managed using Compare-And-Swap (CAS) atomic operations. This ensures that the hot path never blocks, yielding deterministic, bounded execution times in `O(1)` memory allocations.

## 5. Integration and Topography
EDP is packaged as a statically linked library (`edp_core.a`). This prevents the execution delays of dynamic linking payloads on embedded Linux systems. The integration topography relies strictly on CMake dependency graphs to map the hardware abstraction headers to the user's specific board support package (BSP).
