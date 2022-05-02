/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import {
	LoggingDebugSession, TerminatedEvent
} from 'vscode-debugadapter';
import * as vscode from 'vscode';
import { DebugProtocol } from 'vscode-debugprotocol';
import { getPythonPath } from './activatePythonCppDebug';


interface ILaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
	/** An absolute path to the "program" to debug. */
	program: string;
	/** Automatically stop target after launch. If not specified, target does not stop. */
	stopOnEntry?: boolean;
	/** run without debugging */
	noDebug?: boolean;


	pythonLaunchName?;
	pythonLaunch;
	pythonConfig?;
	entirePythonConfig?;

	cppAttachName?;
	cppAttach;
	cppConfig?;
	entireCppConfig?;

	optimizedLaunch?: boolean;
}

export class PythonCppDebugSession extends LoggingDebugSession {

	private folder : vscode.WorkspaceFolder | undefined;

	public constructor() {
		super();

		let folders = vscode.workspace.workspaceFolders;
		if(!folders){
			let message = "Working folder not found, open a folder and try again" ;
			vscode.window.showErrorMessage(message);
			this.sendEvent(new TerminatedEvent());
			return;
		}
		this.folder = folders[0];
	}

	protected async launchRequest(
		response: DebugProtocol.LaunchResponse, 
		args: ILaunchRequestArguments
	) {
		// We terminate the session so that the active debugsession 
		// will be python when we will need it
		this.sendEvent(new TerminatedEvent());
		if(!this.folder){
			let message = "Working folder not found, open a folder and try again" ;
			vscode.window.showErrorMessage(message);
			return;
		}

		let config = await this.checkConfig(args, this.folder);
		if(!config){
			return;
		}
		args = config;

		let pyConf = args.pythonLaunch;
		let cppConf = args.cppAttach;
		
		// We force the Debugger to stopOnEntry so we can attach the cpp debugger
		let oldStopOnEntry : boolean = pyConf.stopOnEntry ? true : false;
		pyConf.stopOnEntry = true;

		await vscode.debug.startDebugging(this.folder, pyConf, undefined).then( pythonStartResponse => {

			if(!vscode.debug.activeDebugSession || !pythonStartResponse){
				return;
			}
			const pySession = vscode.debug.activeDebugSession;
			pySession.customRequest('pydevdSystemInfo').then(res => {

				if(!res.process.pid){
					let message = "The python debugger couldn't send its processId,						\
					 				make sure to enter an Issue on the official Python Cp++ Debug Github about this issue!" ;
					return vscode.window.showErrorMessage(message).then(_ => {
						return;
					});
				}

				// set processid to debugpy processid to attach to
				cppConf.processId = res.process.pid;
				// for vadimcn.vscode-lldb
				cppConf.pid = res.process.pid;

				vscode.debug.startDebugging(this.folder, cppConf, undefined).then(cppStartResponse => {

					// If the Cpp debugger wont start make sure to stop the python debugsession
					if(!cppStartResponse){
						vscode.debug.stopDebugging(pySession);
						return;
					}
					
					// We have to delay the call to continue the process as it might not have fully attached yet
					setTimeout(_ => {
						/** 
						 * If the user hasn't defined/set stopOnEntry in the Python config 
						 * we continue as we force a stopOnEntry to attach the Cpp debugger
						 * */ 
						if(!oldStopOnEntry){
							pySession.customRequest('continue');
						}
					},
					(!args.optimizedLaunch) ? 500 : 0);
				});
			});
		});
		
		this.sendResponse(response);
	}

	protected async checkConfig(config:ILaunchRequestArguments, folder:vscode.WorkspaceFolder): Promise<ILaunchRequestArguments | undefined>{
		
		// Python Launch configuration can be set manually or automatically with the default settings
		let pythonLaunch;
		if(config.entirePythonConfig){
			pythonLaunch = config.entirePythonConfig
		}
		else if(!config.pythonConfig || config.pythonConfig === "custom" || config.pythonConfig === "manual"){
			// Make sure the user has defined the properties 'pythonLaunchName' & 'cppAttachName
			if(!config.pythonLaunchName){
				let msg = "Please make sure to define 'pythonLaunchName' for pythonCpp in your launch.json file or set 'pythonConfig' to default";
				return vscode.window.showErrorMessage(msg).then(_ => {
					return undefined;	// abort launch
				});
			} 
			else{
				pythonLaunch = getConfig(config.pythonLaunchName, folder);
				if(!pythonLaunch){
					let message = "Please make sure you have a configurations with the names '" + config.pythonLaunchName + "' in your launch.json file.";
					vscode.window.showErrorMessage(message);
					return undefined;
				}
			}
		}
		else if(config.pythonConfig === "default"){
			pythonLaunch = {
				"name": "Python: Current File",
				"type": "python",
				"request": "launch",
				"program": "${file}",
				"console": "integratedTerminal"
			};
		}

		// C++ launch configuration can be set manually or automatically with the default settings
		let cppAttach;
		if(config.entireCppConfig){
			cppAttach = config.entireCppConfig
		}
		else if(!config.cppConfig || config.cppConfig === "custom" || config.cppConfig === "manual"){
			// Make sure the user has defined the property 'cppAttachName'
			if(!config.cppAttachName){
				let msg = "Make sure to either define 'cppAttachName' for pythonCpp in your launch.json file or use the default configurations with the attribute 'cppConfig'";
				return vscode.window.showErrorMessage(msg).then(_ => {
					return undefined;	// abort launch
				});
			} 
			else{
				cppAttach = getConfig(config.cppAttachName, folder);
				if(!cppAttach){
					let message = "Make sure you have a configurations with the names '" + config.cppAttachName + "' in your launch.json file.";
					vscode.window.showErrorMessage(message);
					return undefined;
				}

				// If the program field isn't specified, fill it in automatically
				if(!cppAttach["program"] && cppAttach["type"] == "cppdbg"){
					cppAttach["program"] = await getPythonPath(null);
				}

				cppAttach["processId"] = "";
			}
		}
		else if(config.cppConfig === "default (win) Attach"){
			cppAttach = {
				"name": "(Windows) Attach",
				"type": "cppvsdbg",
				"request": "attach",
				"processId": ""
			};
		}
		else if(config.cppConfig === "default (gdb) Attach"){
			cppAttach = {
				"name": "(gdb) Attach",
				"type": "cppdbg",
				"request": "attach",
				"program": await getPythonPath(null),
				"processId": "",
				"MIMode": "gdb",
				"setupCommands": [
					{
						"description": "Enable pretty-printing for gdb",
						"text": "-enable-pretty-printing",
						"ignoreFailures": true
					}
				]
			}
		}

		config.pythonLaunch = pythonLaunch;
		config.cppAttach = cppAttach;

		return config;
	}
}

function getConfig(name:string, folder:vscode.WorkspaceFolder): JSON | undefined{
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
