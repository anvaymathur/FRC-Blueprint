# FRC Blueprint

**FRC Blueprint** is an interactive, native VS Code extension designed to accelerate WPILib robot code development for FIRST Robotics Competition (FRC) teams. 

Instead of relying on rigid, static snippets or copying and pasting old code, FRC Blueprint provides a native, interactive state-machine wizard that guides you through the setup of standard robot mechanisms. It dynamically generates tailored, highly-structured boilerplate code, complete with hardware-specific configurations, dynamic follower motor logic, and WPILib physics simulation support. 

Built with **AdvantageKit** and **Hardware-Specific IO Interfaces** in mind, this extension enforces best practices for Command-Based robot architectures right out of the box.

---

## Key Features

### Interactive Subsystem Wizard
Trigger the command palette, and FRC Blueprint walks you through a native, multi-step UI flow to configure your mechanism. Made a mistake? Use the native **Back** button to return to a previous step without losing your typed inputs or having to cancel the command.

### Mechanism Archetypes
Instantly generate complete file structures for the most common FRC mechanisms. The extension currently supports:
* **Linear Mechanisms:** Elevators, telescoping arms, and linear actuators.
* **Pivoting Mechanisms:** Single-jointed arms, wrists, and rotational intakes.
* **Continuous Rotation Mechanisms:** Flywheels, shooters, and spinning rollers.

### Hardware-Specific Boilerplate
Stop writing the same motor configuration code over and over. Select your motor controller type during setup, and the extension generates the correct configuration API, PID slots, and telemetry updates.
* **Currently Supported:** CTRE TalonFX (Kraken X60, Falcon 500)
* **In Development:** REV SPARK MAX (NEO, NEO 550). It is visible in the setup flow, but generation is not available yet.

### Dynamic Follower Scaling
Specify your exact follower motor count, and the EJS templating engine will automatically scale the generated Java files. It dynamically injects:
* Follower instantiations and CAN ID parameters.
* Opposed/Matching motor alignment configurations.
* Mirrored telemetry signals and `StatusSignal` refresh loops.

### Out-of-the-Box Simulation (IOSim)
Develop your code before the robot is built. Every generated subsystem includes an `IOSim` implementation pre-configured with WPILib physics classes (`SingleJointedArmSim`, `FlywheelSim`, `ElevatorSim`). The extension automatically calculates the simulated `DCMotor` current limits and inertias based on your selected follower motor count.

### Smart Workspace Memory
Tired of clicking through the file explorer to find your `subsystems` folder? FRC Blueprint utilizes the VS Code Workspace Configuration API. The first time you generate a mechanism, it saves your target directory to `.vscode/settings.json`. The next time you run the command, it bypasses the folder selection entirely.

---

## Getting Started

### Prerequisites
* **Visual Studio Code (WPILib):** Version `^1.102.0` or higher. It is highly recommended that you use the official **WPILib VS Code** installation provided by the FRC WPILib installer. You can download the latest release from the [WPILib GitHub Releases page](https://github.com/wpilibsuite/allwpilib/releases).
* **FRC Toolchain:** Your project must be a Java-based WPILib project utilizing the **Command-Based Framework**.
* **Dependencies:** TalonFX-generated files assume the presence of `CTRE Phoenix 6`, `AdvantageKit`, and WPILib standard math/physics libraries.

### Installation
1. Open VS Code.
2. Open the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
3. Search for **FRC Blueprint** and select **Install**.

You can also install it directly from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=anvay-mathur.frc-blueprint). A `.vsix` download is not required for normal installation.

---

## Usage Guide

Generating a new subsystem takes less than 10 seconds. 

1. Open the VS Code Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
2. Type and execute: **`FRC: Create New Subsystem`**.
3. **Step 1:** Select the Mechanism Archetype (Linear, Pivoting, or Continuous).
4. **Step 2:** Type the name of your subsystem (e.g., `Elevator`, `Wrist`, `Shooter`). Safe Java naming conventions (PascalCase/camelCase) are enforced.
5. **Step 3:** Enter the number of follower motors attached to the mechanism (e.g., `0`, `1`, `2`).
6. **Step 4:** Select your Motor Controller type. Choose `TalonFX` to generate files; SPARK MAX support is still in development.
7. **Complete:** The extension generates the folder and files instantly.

### Example Output Structure
If you generate a Pivoting Mechanism named `Arm` with 1 follower motor using TalonFX controllers, the extension generates the following architecture:

```text
src/main/java/frc/robot/subsystems/
└── arm/
    ├── Arm.java                 (High-level Subsystem wrapper & Commands)
    ├── ArmConstants.java        (Hardware IDs, PID/Feedforward, Gear Ratios)
    ├── ArmIO.java               (Interface for AutoLogged inputs)
    ├── ArmIOSim.java            (WPILib SingleJointedArmSim implementation)
    └── ArmIOTalonFX.java        (CTRE Phoenix 6 Hardware implementation)
```

## Extension Settings

This extension contributes the following settings to your workspace (`.vscode/settings.json`):

* **`frc-blueprint.subsystemsPath`**: The absolute file path to your robot's subsystems directory. 
  * *Note: You do not need to configure this manually. The extension prompts you to select a folder via the UI on your first run and automatically saves the path for future use.*

To change or reset this path, simply open your `.vscode/settings.json` file and edit or delete the `"frc-blueprint.subsystemsPath"` entry.

---

## Known Issues & Limitations

* **SPARK MAX Support:** REV SPARK MAX is visible in the motor-controller selection UI, but its templates are not implemented yet. Selecting it displays a warning and does not generate a hardware IO implementation.
* **Physics Tuning:** The generated `IOSim` files provide the structural boilerplate for simulation. However, you must manually tune the physical constants (e.g., Center of Gravity length, Mass, and Moment of Inertia) in the `Constants` file to make the simulation accurately reflect your specific robot's behavior.

---

## Contributing

We welcome contributions from the FIRST Robotics community! If you have suggestions for better boilerplate structures, new hardware integrations, or bug fixes:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

*Built for FRC Teams, by FRC Teams. Good luck this season!*