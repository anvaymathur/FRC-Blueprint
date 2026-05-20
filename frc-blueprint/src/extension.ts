// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ejs = require('ejs');

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
            case SubsystemType.SPINNING_SUBSYSTEM: // Mapped to 'Continuous Rotation Mechanism'
                templateFolder = "continuousRotationSubsystem";
                templatePrefix = "ContinuousRotationSubsystem";
                break;
            case SubsystemType.PIVOTING_SUBSYSTEM: // Mapped to 'Pivoting Mechanism'
                templateFolder = "pivotingSubsystem";
                templatePrefix = "pivotingSubsystem";
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
        const folderName = name.charAt(0).toLowerCase() + name.slice(1);
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
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        // vscode.window.showInformationMessage('Hello World from FRC Blueprint!');
        const selection = await vscode.window.showQuickPick(Object.keys(subsystemMap), { title: "Select type of subsystem" });

        if (!selection) return;

        const subsystemType = subsystemMap[selection as keyof typeof subsystemMap];

        const subsystemName = await vscode.window.showInputBox({ prompt: "Enter subsystem name" });

        if (!subsystemName) return;

        // const followerMotorCount = await vscode.window.showQuickPick(['0', '1', '2', '3'], { placeHolder: 'How many follower motors in this subsystem?' });
        const followerMotorCount = await vscode.window.showInputBox({ prompt: "How many follower motors in this subsystem?", 
            validateInput: (text) => {
                if (text.length == 0){
                    return "Count cannot be empty";
                }

                if (!/^\d+$/.test(text)){
                    return "Please enter a valid positive number (e.g., 0, 1, 2).";
                }

                if (parseInt(text,10) > 10){
                    return "Please enter a valid number between 0 and 10"
                }

                return null;
            }
        });

        if (!followerMotorCount) return;

        const motorsSelection = await vscode.window.showQuickPick(Object.keys(motorMap), { title: "Select type of motors" });

        if (!motorsSelection) return;

        const motorsType = motorMap[motorsSelection as keyof typeof motorMap];


        const folderUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select subsystem folder'
        });

        if (!folderUri || folderUri.length === 0) return;

        const selectedFolder = folderUri[0];

        if (subsystemName && followerMotorCount) {
            generateFiles(subsystemName, subsystemType, followerMotorCount, motorsType, selectedFolder);
        }

    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }