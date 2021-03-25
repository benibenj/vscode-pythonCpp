/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import { WorkspaceFolder, DebugConfiguration, ProviderResult, CancellationToken } from 'vscode';
import { PythonCppDebugSession } from './pythonCppDebug';

export function activatePythonCppDebug(context: vscode.ExtensionContext, factory?: vscode.DebugAdapterDescriptorFactory) {

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.pythonCpp-debug.runEditorContents', (resource: vscode.Uri) => {
			let targetResource = resource;
			if (!targetResource && vscode.window.activeTextEditor) {
				targetResource = vscode.window.activeTextEditor.document.uri;
			}
			if (targetResource) {
				vscode.debug.startDebugging(undefined, {
						type: 'pythoncpp',
						name: 'PythonCpp Debug',
						request: 'launch',
						pythonLaunchName: "Python: Current File",
              			cppAttachName: "(Windows) Attach"
					},
					{ noDebug: true }
				);
			}
		}),
		vscode.commands.registerCommand('extension.pythonCpp-debug.debugEditorContents', (resource: vscode.Uri) => {
			let targetResource = resource;
			if (!targetResource && vscode.window.activeTextEditor) {
				targetResource = vscode.window.activeTextEditor.document.uri;
			}
			if (targetResource) {
				vscode.debug.startDebugging(undefined, {
					type: 'pythoncpp',
					name: 'PythonCpp Debug',
					request: 'launch',
					pythonLaunchName: "Python: Current File",
              		cppAttachName: "(Windows) Attach"
				});
			}
		}),
		vscode.commands.registerCommand('extension.pythonCpp-debug.restart', _ => {
			console.log("Restarting PythonCpp Debug");
			let session = vscode.debug.activeDebugSession;
			console.log(session);
			if(session && session.type === 'python'){
				vscode.debug.stopDebugging(session);
			}
		})
	);

	// register a configuration provider for 'pythoncpp' debug type
	const provider = new PythonCppConfigurationProvider();
	context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('pythoncpp', provider));

		

	if (!factory) {
		factory = new InlineDebugAdapterFactory();
	}
	context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('pythoncpp', factory));
	if ('dispose' in factory) {
		context.subscriptions.push(factory);
	}

}

class PythonCppConfigurationProvider implements vscode.DebugConfigurationProvider {

	/**
	 * Check Debug Configuration before DebugSession is launched
	 */
	resolveDebugConfiguration(folder: WorkspaceFolder | undefined, config: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration> {
		
		// if launch.json is missing or empty
		if (!config.type && !config.request && !config.name) {
			let msg = "Please make sure you have a launch.json file with a configuration of type 'pythoncpp' to use this debugger";
			return vscode.window.showInformationMessage(msg).then(_ => {
				return undefined;	// abort launch
			});
		}
		// Make sure the user has defined the properties 'pythonLaunchName' & 'cppAttachName
		if(!config.pythonLaunchName || !config.cppAttachName){
			let msg = "Please make sure to define 'pythonLaunchName' & 'cppAttachName' for pythonCpp in your launch.json file";
			return vscode.window.showInformationMessage(msg).then(_ => {
				return undefined;	// abort launch
			});
		}

		// Get the launch.json configurations
		if(!folder){
			let message = "Working folder not found, open a folder and try again" ;
			vscode.window.showErrorMessage(message);
			return undefined;
		}

		let pythonLaunchName = getConfig(config.pythonLaunchName, folder);
		let cppAttachName = getConfig(config.cppAttachName, folder);
		
		if(!pythonLaunchName || !cppAttachName){
			let message = "Please make sure you have a configurations with the names '" + config.pythonLaunchName + "' & '" + config.cppAttachName + "' in your launch.json file.";
			vscode.window.showErrorMessage(message);
			return undefined;
		}

		/* 
			We have to stringify both python and cpp configs as they might use commands (for example command:pickprocess) 
			that this extension hasn't defined and would cause an error. We need to make sure to JSON.parse(...) them 
			before handing them to the debuggers.
		*/
		config.pythonLaunch = JSON.stringify(pythonLaunchName);
		config.cppAttach = JSON.stringify(cppAttachName);
		console.log(config);
		return config;
	}

	async provideDebugConfigurations(folder?: vscode.WorkspaceFolder, token?: vscode.CancellationToken): Promise<vscode.DebugConfiguration[]> {
		
        interface MenuItem extends vscode.QuickPickItem {
            configuration: vscode.DebugConfiguration;
        }

		const gdbConfig : vscode.DebugConfiguration = {
            "name": "(gdb) Attach",
            "type": "cppdbg",
            "request": "attach",
            "program": await this.getPythonPath(null),
            "processId": "",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "MIMode": "gdb",
            "miDebuggerPath": "/path/to/gdb",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ]
        };

		const winConfig : vscode.DebugConfiguration = {
            "name": "(Windows) Attach",
            "type": "cppvsdbg",
            "request": "attach",
            "processId": ""
        };
		
        const items: MenuItem[] = [
			{ label: "PythonCpp Debug", configuration: winConfig, description: "Windows" },
			{ label: "PythonCpp Debug", configuration: gdbConfig, description: "GDB" }
		];
		
        const selection: MenuItem | undefined = await vscode.window.showQuickPick(items, {placeHolder: "Select a configuration"});
        if (!selection) {
            return []; // User canceled it.
        }

		const pythonConfig : vscode.DebugConfiguration = {
			"name": "Python: Current File",
			"type": "python",
			"request": "launch",
			"program": "${file}",
			"console": "integratedTerminal"
		};
		
        return [selection.configuration, pythonConfig];
    }

	public async getPythonPath(
        document: vscode.TextDocument | null
    ): Promise<string> {
        try {
            let pyExt = vscode.extensions.getExtension('ms-python.python');
            if (!pyExt){
				return 'python';
			}

            if (pyExt.packageJSON?.featureFlags?.usingNewInterpreterStorage) {
                if (!pyExt.isActive){
					await pyExt.activate();
				}
                    
                const pythonPath = pyExt.exports.settings.getExecutionDetails ?
                    pyExt.exports.settings.getExecutionDetails(
                        document?.uri
                    ).execCommand :
                    pyExt.exports.settings.getExecutionCommand(document?.uri);
                return pythonPath ? pythonPath.join(' ') : 'python';
            } else {
                let path;
                if (document){
					path = vscode.workspace.getConfiguration(
                        'python',
                        document.uri
                    ).get<string>('pythonPath');
				}
                else{
					path = vscode.workspace.getConfiguration(
                        'python'
                    ).get<string>('pythonPath');
				}
                if(!path){
					return 'python';
				} 
            }
        } catch (ignored) {
            return 'python';
        }
        return 'python';
    }

}



function getConfig(name:string, folder:WorkspaceFolder): JSON | undefined{
	const launchConfigs = vscode.workspace.getConfiguration('launch', folder.uri);
	const values: JSON | undefined = launchConfigs.get('configurations');
	if(!values){
		let message = "Unexpected error with the launch.json file" ;
		vscode.window.showErrorMessage(message);
		return undefined;
	}

	return nameDefinedInLaunch(name, values);
}

function nameDefinedInLaunch(name:string, launch:JSON): JSON | undefined {
	let i = 0;
	while(launch[i]){
		if(launch[i].name === name){
			return launch[i];
		}
		i++;
	}
	return undefined;
}



class InlineDebugAdapterFactory implements vscode.DebugAdapterDescriptorFactory {

	createDebugAdapterDescriptor(_session: vscode.DebugSession): ProviderResult<vscode.DebugAdapterDescriptor> {
		return new vscode.DebugAdapterInlineImplementation(new PythonCppDebugSession());
	}
}
