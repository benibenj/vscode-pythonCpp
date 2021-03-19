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
			let message = "Working folder not found, open a folder an try again" ;
			vscode.window.showErrorMessage(message);
			return;
		}

		// We double all backslashes inside a string so that JSON.parse() doesn't crash due to handling '\' as escape charecter
		let pyConf = JSON.parse(this.doubleBackslash(args.pythonLaunch));
		let cppConf = JSON.parse(this.doubleBackslash(args.cppAttach));
		
		// We force the Debugger to stopOnEntry so we can attach the cpp debugger
		let oldStopOnEntry : boolean = pyConf.stopOnEntry ? true : false;
		pyConf.stopOnEntry = true;

		vscode.debug.startDebugging(folders[0], pyConf, undefined).then( _ => {
			if(! vscode.debug.activeDebugSession){
				return;
			}

			vscode.debug.activeDebugSession.customRequest('pydevdSystemInfo').then(res => {

				// start cpp attach
				if(!folders){
					let message = "Working folder not found, open a folder an try again" ;
					vscode.window.showErrorMessage(message);
					return;
				}
				// set processid to debugpy processid to attach to
				cppConf.processId = res.process.pid;
				vscode.debug.startDebugging(folders[0], cppConf, undefined).then(_ => {
					
					// We have to delay the call to contune the process as it might not have fully attached yet
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

		vscode.debug.onDidReceiveDebugSessionCustomEvent(res=>{
			console.log("Custom Event: ");
			console.log(res);
		});

		/*
		vscode.debug.onDidChangeActiveDebugSession(res=>{
			console.log("changed: ");
			console.log(res);
		});*/

		vscode.debug.onDidStartDebugSession(res=>{
			console.log("start: ");
			console.log(res);
		});

		vscode.debug.onDidTerminateDebugSession(res=>{
			console.log("end: ");
			console.log(res);
		});

		// wait until configuration has finished (and configurationDoneRequest has been called)
		//await this._configurationDone.wait(1000);
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
