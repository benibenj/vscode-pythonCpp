/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import {
	LoggingDebugSession, TerminatedEvent
} from 'vscode-debugadapter';
import * as vscode from 'vscode';
import { DebugProtocol } from 'vscode-debugprotocol';


interface ILaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
	/** An absolute path to the "program" to debug. */
	program: string;
	/** Automatically stop target after launch. If not specified, target does not stop. */
	stopOnEntry?: boolean;
	/** run without debugging */
	noDebug?: boolean;

	pythonLaunchName: string;
	pythonLaunch: string;
	cppAttachName: string;
	cppAttach: string;
}

export class PythonCppDebugSession extends LoggingDebugSession {

	public constructor() {
		super();
	}

	protected async launchRequest(response: DebugProtocol.LaunchResponse, args: ILaunchRequestArguments) {
		
		let folders = vscode.workspace.workspaceFolders;

		if(!folders){
			let message = "Working folder not found, open a folder and try again" ;
			vscode.window.showErrorMessage(message);
			return;
		}

		
		// We double all backslashes inside a string so that JSON.parse() doesn't crash due to handling '\' as escape charecter
		let pyConf = JSON.parse(this.doubleBackslash(args.pythonLaunch));
		let cppConf = JSON.parse(this.doubleBackslash(args.cppAttach));
		
		// We force the Debugger to stopOnEntry so we can attach the cpp debugger
		let oldStopOnEntry : boolean = pyConf.stopOnEntry ? true : false;
		pyConf.stopOnEntry = true;

		vscode.debug.startDebugging(folders[0], pyConf, undefined).then( pythonStartResponse => {

			if(!vscode.debug.activeDebugSession || !pythonStartResponse){
				return;
			}

			vscode.debug.activeDebugSession.customRequest('pydevdSystemInfo').then(res => {

				if(!folders){
					let message = "Working folder not found, open a folder and try again" ;
					vscode.window.showErrorMessage(message);
					return;
				}

				if(!res.process.pid){
					let message = "The python debugger couldn't send its processId,						\
					 				make sure to enter an Issue on the official PythonCpp Debug Github about this issue!" ;
					vscode.window.showErrorMessage(message);
					return;
				}

				// set processid to debugpy processid to attach to
				cppConf.processId = res.process.pid;

				vscode.debug.startDebugging(folders[0], cppConf, undefined).then(cppStartResponse => {

					// If the Cpp debugger wont start make sure to stop the python debugsession
					let pythonSession = vscode.debug.activeDebugSession;
					if(!cppStartResponse && pythonSession && pythonSession.type === 'python'){
						vscode.debug.stopDebugging(pythonSession);
						return;
					}
					
					// We have to delay the call to continue the process as it might not have fully attached yet
					setTimeout(_ => {
						/** 
						 * If the user hasn't defined/set stopOnEntry in the Python config 
						 * we continue as we force a stopOnEntry to attach the Cpp debugger
						 * */ 
						if(vscode.debug.activeDebugSession && !oldStopOnEntry){
							vscode.debug.activeDebugSession.customRequest('continue');
						}
					},
					500);
				});
			});
		});
		
		this.sendEvent(new TerminatedEvent());
		this.sendResponse(response);
	}

	// We double all backslashes inside a string and return it
	protected doubleBackslash(s:string) : string{
		 return s.split('').map(function(v) {
			return v === "\\" ? v + v : v;
		  }).join('');
	}

}
