# Changelog

All notable changes to the "frc-blueprint" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-05-20

### Added
- **Interactive Subsystem Wizard**: A native, multi-step UI flow for generating WPILib subsystems with built-in "Back" button navigation.
- **Dynamic EJS Templating Engine**: Replaced static snippets with a dynamic rendering pipeline to automatically inject custom subsystem names, properties, and loop structures.
- **Hardware-Specific Boilerplate**: Support for generating configured motor controller files, starting with complete TalonFX integration.
- **Follower Motor Scaling**: Automated generation of follower motor configurations, including alignment constants, telemetry updates, and simulated inertia scaling.
- **Input Validation**: Strict regex validation on user inputs to enforce safe Java class naming conventions and cap follower motor counts at realistic hardware limits.
- **Workspace Memory**: Implemented VS Code Workspace Configuration to automatically save and retrieve the user's subsystem target directory in `.vscode/settings.json`, eliminating repetitive folder selection.
- **Mechanism Archetypes**: Base templates for Linear, Pivoting, and Continuous Rotation mechanisms.
- **Simulation Support**: Included `IOSim` templates that utilize WPILib physics classes (`SingleJointedArmSim`, `FlywheelSim`, `ElevatorSim`) paired with `DCMotor` allocations based on user follower counts.

### Changed
- Replaced isolated prompt menus (`showQuickPick` and `showInputBox`) with a unified State Machine wizard using `createQuickPick` and `createInputBox` for better user experience and state retention.
- Refactored the `generateFiles` TypeScript function to utilize a switch statement for dynamic template routing based on the selected mechanism archetype.