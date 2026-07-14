# The Mode That Never Corrects Itself: Bridging Analog Physics and Digital Verification

**Date:** July 2026  
**Subject:** Mixed-Signal Design Verification (MSDV) and SiliconForge

When verifying complex mixed-signal systems, digital Verification Engineers rely heavily on Discrete-Event Simulation (like standard UVM environments) and Real-Number Models (RNMs). They are fast and scale well to massive continuous integration (CI) pipelines.

But they hide a fundamental physical flaw.

In a free-running oscillator (like an LC VCO), there is a structural quirk that breaks standard digital assumptions: the limit cycle is **translation-invariant in time**. This means that if you nudge the *amplitude* of an oscillator, the circuit's nonlinearity fights back, damping the perturbation until the system returns to its steady-state limit cycle. But if you nudge the *phase*, nothing fights back. The oscillator accepts the new phase and continues forever. 

Mathematically, if you compute the state transition matrix (the monodromy matrix) over one period, exactly one of its eigenvalues (Floquet multipliers) sits squarely on `1.0`.

This is the mode that never corrects itself. And it is the entire reason phase noise exists.

## The Heuristic Noise Fallacy

In traditional UVM environments, when an engineer wants to model "noise" in a PLL or ADC, they typically inject arbitrary Gaussian jitter into their digital clock edges. 

This is mathematically unsound. Noise in a nonlinear analog circuit is not stationary; it is **cyclostationary**. An impulse of thermal noise hitting the transistor at the zero-crossing (maximum $dV/dt$) causes a massive, permanent phase shift. The exact same impulse hitting the transistor at its voltage peak (zero $dV/dt$) causes almost no phase shift at all, absorbing into the amplitude and decaying away.

```mermaid
flowchart TD
    A[Thermal Noise Impulse] --> B{Where in the cycle?}
    B -->|Zero-Crossing (Max dV/dt)| C[Permanent Phase Shift]
    B -->|Voltage Peak (Min dV/dt)| D[Amplitude Shift]
    D --> E[Decays Back to Limit Cycle]
```

## The SiliconForge Solution

To accurately map this continuous-time physics into a discrete-event digital verification environment, I built **SiliconForge**. 

Instead of guessing a noise distribution, SiliconForge explicitly extracts the **Perturbation Projection Vector (PPV)** from a transient SPICE simulation. The PPV definitively calculates how charge injected at different phases of an oscillation causes varying temporal deviations ($\Delta t$).

### From Physics to SystemVerilog

Once the PPV matrix is extracted using the Python core, SiliconForge utilizes a Jinja2 AST engine to translate these nonlinear matrices into deterministic SystemVerilog constraints and UVM `covergroup` models. 

This bridges the gap. The digital regression now runs with the exact jitter histogram fidelity of a multi-hour SPICE simulation, but it executes in seconds.

## A Live Digital Constraint: The Phase-Safe Window

The ultimate proof of this framework came during the integration of a varactorless VCO.

Because we know the exact shape of the Impulse Sensitivity Function (ISF), we know exactly when the oscillator is immune to phase shifts (at the voltage peaks). By gating our digital retuning updates—the switched-cap tuning word—to fire *only* inside a narrow window around these voltage peaks, the switching transient lands almost entirely in the amplitude direction.

In the final integration, SiliconForge was used to generate a live `ppv_violation_flag` inside a running digital control loop (an AFC/AAC finite state machine). 

During a simulated heavy AI inference workload burst, the digital testbench actively flagged any retuning update that fell outside the physical phase-safe window calculated by the SPICE solver. 

*SiliconForge isn't just an offline noise calculator; it is an active, deterministic constraint engine bridging analog reality with digital speed.*
