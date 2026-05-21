// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ejs = require('ejs');

// A special token so we know when the user clicked the Back button
const BACK_BUTTON = Symbol('BACK');

// --- WIZARD HELPER FUNCTIONS ---
async function runQuickPickStep(step: number, totalSteps: number, title: string, items: vscode.QuickPickItem[]) {
    return new Promise<vscode.QuickPickItem | typeof BACK_BUTTON | undefined>((resolve) => {
        const qp = vscode.window.createQuickPick();
        qp.title = title;
        qp.step = step;
        qp.totalSteps = totalSteps;
        qp.items = items;
        qp.ignoreFocusOut = true; 

        if (step > 1) {
            qp.buttons = [vscode.QuickInputButtons.Back];
        }

        qp.onDidTriggerButton(btn => {
            if (btn === vscode.QuickInputButtons.Back) {
                qp.hide();
                resolve(BACK_BUTTON);
            }
        });

        qp.onDidAccept(() => {
            const selected = qp.activeItems[0];
            qp.hide();
            resolve(selected);
        });

        qp.onDidHide(() => {
            qp.dispose();
            resolve(undefined);
        });

        qp.show();
    });
}

async function runInputBoxStep(step: number, totalSteps: number, title: string, prompt: string, validate?: (text: string) => string | null, value: string = '') {
    return new Promise<string | typeof BACK_BUTTON | undefined>((resolve) => {
        const input = vscode.window.createInputBox();
        input.title = title;
        input.step = step;
        input.totalSteps = totalSteps;
        input.prompt = prompt;
        input.value = value;
        input.ignoreFocusOut = true;

        if (step > 1) {
            input.buttons = [vscode.QuickInputButtons.Back];
        }

        input.onDidTriggerButton(btn => {
            if (btn === vscode.QuickInputButtons.Back) {
                input.hide();
                resolve(BACK_BUTTON);
            }
        });

        input.onDidChangeValue(text => {
            if (validate) {
                const error = validate(text);
                input.validationMessage = error ? error : undefined;
            }
        });

        input.onDidAccept(() => {
            if (!input.validationMessage) {
                const text = input.value;
                input.hide();
                resolve(text);
            }
        });

        input.onDidHide(() => {
            input.dispose();
            resolve(undefined);
        });

        input.show();
    });
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "frc-blueprint" is now active!');

    enum SubsystemType {
        LINEAR_SUBSYSTEM,
        SPINNING_SUBSYSTEM,
        PIVOTING_SUBSYSTEM
    }

    enum MotorTypes {
        TALON_FX,
        SPARK_MAX
    }

    const subsystemMap = {
        'Linear Mechanism': SubsystemType.LINEAR_SUBSYSTEM,
        'Pivoting Mechanism': SubsystemType.PIVOTING_SUBSYSTEM,
        'Continuous Rotation Mechanism': SubsystemType.SPINNING_SUBSYSTEM
    } as const;

    const motorMap = {
        'TalonFX': MotorTypes.TALON_FX,
        'SPARK MAX': MotorTypes.SPARK_MAX
    } as const;


    async function generateFiles(name: string, subsystemType: SubsystemType, followerMotors: string, motorsType: MotorTypes, selectedFolder: vscode.Uri) {

        // Determine template folder and file prefix based on the selected subsystem type
        let templateFolder = "";
        let templatePrefix = "";

        switch (subsystemType) {
            case SubsystemType.LINEAR_SUBSYSTEM:
                templateFolder = "linearSubsystem";
                templatePrefix = "LinearSubsystem";
                break;
            case SubsystemType.SPINNING_SUBSYSTEM: 
                templateFolder = "continuousRotationSubsystem";
                templatePrefix = "ContinuousRotationSubsystem";
                break;
            case SubsystemType.PIVOTING_SUBSYSTEM: 
                templateFolder = "pivotingSubsystem";
                templatePrefix = "PivotingSubsystem";
                break;
            default:
                vscode.window.showErrorMessage("Unknown subsystem type selected.");
                return;
        }

        // 1. Prepare data for EJS
        // Convert the quick pick string (e.g. "2") into a number for the EJS loop
        const numFollowers = parseInt(followerMotors, 10) || 0;
        const templateData = {
            name: name,
            numFollowers: numFollowers
        };

        // Ensure the folder is named with a lowercase first letter (camelCase)
        const folderName = name.toLowerCase();
        const folderUri = vscode.Uri.joinPath(selectedFolder, folderName);

        await vscode.workspace.fs.createDirectory(folderUri);

        // Helper function to read an EJS template, render it, and write it to the new folder
        const renderAndWrite = async (templateFileName: string, outputFileName: string) => {
            // Dynamically inject the correct template folder here
            const templatePath = vscode.Uri.joinPath(context.extensionUri, 'src', 'templates', templateFolder, templateFileName);

            try {
                const templateBuffer = await vscode.workspace.fs.readFile(templatePath);
                const templateString = Buffer.from(templateBuffer).toString('utf8');

                const renderedContent = ejs.render(templateString, templateData);

                const outputUri = vscode.Uri.joinPath(folderUri, outputFileName);
                await vscode.workspace.fs.writeFile(outputUri, Buffer.from(renderedContent, 'utf8'));
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to generate ${outputFileName}: ${error}`);
                console.error(error);
            }
        };

        // Capitalize the first letter for the generated Java file names (PascalCase)
        const className = name.charAt(0).toUpperCase() + name.slice(1);

        // 2. Generate the standard subsystem files dynamically
        await renderAndWrite(`${templatePrefix}.java.ejs`, `${className}.java`);
        await renderAndWrite(`${templatePrefix}IO.java.ejs`, `${className}IO.java`);
        await renderAndWrite(`${templatePrefix}IOSim.java.ejs`, `${className}IOSim.java`);
        await renderAndWrite(`${templatePrefix}Constants.java.ejs`, `${className}Constants.java`);

        // 3. Generate the hardware-specific file based on the motor selection
        if (motorsType === MotorTypes.TALON_FX) {
            await renderAndWrite(`${templatePrefix}IOTalonFX.java.ejs`, `${className}IOTalonFX.java`);
        } else if (motorsType === MotorTypes.SPARK_MAX) {
            // Ready for when you create your SparkMax templates!
            // await renderAndWrite(`${templatePrefix}IOSparkMax.java.ejs`, `${className}IOSparkMax.java`);
            vscode.window.showWarningMessage("SPARK MAX templates are not implemented yet!");
        }

        vscode.window.showInformationMessage(`${className} subsystem created!`);
    }

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('frc-blueprint.createSubsystem', async () => {
        
        // State object to hold answers
        const state: {
            type?: string,
            name?: string,
            followers?: string,
            motors?: string
        } = {};

        let currentStep = 1;
        const totalSteps = 4;

        // The Wizard State Machine Loop
        while (currentStep > 0 && currentStep <= totalSteps) {

            switch (currentStep){
                case 1: {
                    const items = Object.keys(subsystemMap).map(label => ({ label }));
                    const result = await runQuickPickStep(currentStep, totalSteps, "Select Subsystem Type", items);
                    
                    if (result === undefined) return; 
                    if (result === BACK_BUTTON) { currentStep--; continue; } 
                    
                    state.type = result.label;
                    currentStep++;
                    break;
                }    
                case 2: {
                    const result = await runInputBoxStep(
                        currentStep, totalSteps, 
                        "Subsystem Name", "Enter the name of your subsystem (e.g. Elevator)", 
                        (text) => {
                            if (text.length === 0) return "Name cannot be empty.";
                            if (!/^[a-zA-Z0-9_]+$/.test(text)) return "Name can only contain letters, numbers, and underscores.";
                            return null;
                        },
                        state.name 
                    );

                    if (result === undefined) return; 
                    if (result === BACK_BUTTON) { currentStep--; continue; } 
                    
                    state.name = result;
                    currentStep++;
                    break;
                }

                case 3: {
                    const result = await runInputBoxStep(
                        currentStep, totalSteps, 
                        "Follower Motors", "How many follower motors in this subsystem?", 
                        (text) => {
                            if (text.length == 0) return "Count cannot be empty";
                            if (!/^\d+$/.test(text)) return "Please enter a valid positive number (e.g., 0, 1, 2).";
                            if (parseInt(text, 10) > 10) return "Please enter a valid number between 0 and 10";
                            return null;
                        },
                        state.followers
                    );

                    if (result === undefined) return; 
                    if (result === BACK_BUTTON) { currentStep--; continue; } 
                    
                    state.followers = result;
                    currentStep++;
                    break;
                }

                case 4: {
                    const items = Object.keys(motorMap).map(label => ({ label }));
                    const result = await runQuickPickStep(currentStep, totalSteps, "Select Motor Controller", items);

                    if (result === undefined) return; 
                    if (result === BACK_BUTTON) { currentStep--; continue; } 
                    
                    state.motors = result.label;
                    currentStep++; 
                    break;
                }

            }
        }

        // Final Execution
        const config = vscode.workspace.getConfiguration('frc-blueprint');
        let savedPath = config.get<string>('subsystemsPath');
        let targetFolderUri: vscode.Uri;

        if (savedPath) {
            // 1. If we found a saved path, convert the string back into a Uri
            targetFolderUri = vscode.Uri.file(savedPath);
        } else {
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select subsystem folder'
            });

            if (!folderUri || folderUri.length === 0) return;

            targetFolderUri = folderUri[0];

            await config.update('subsystemsPath', targetFolderUri.fsPath, vscode.ConfigurationTarget.Workspace);

            vscode.window.showInformationMessage("Subsystems folder saved for future use!");

        }
        
        const finalSubsystemType = subsystemMap[state.type as keyof typeof subsystemMap];
        const finalMotorType = motorMap[state.motors as keyof typeof motorMap];

        if (state.name && state.followers) {
            generateFiles(state.name, finalSubsystemType, state.followers, finalMotorType, targetFolderUri);
        }
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }