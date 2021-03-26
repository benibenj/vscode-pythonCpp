/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import { activatePythonCppDebug } from './activatePythonCppDebug';

let extPy;
let extCpp;

export async function activate(context: vscode.ExtensionContext) {
	// run the debug adapter inside the extension and directly talk to it

	// Check if the user has the extension installed and if so, activate them
	extPy = vscode.extensions.getExtension("ms-python.python");
	extCpp = vscode.extensions.getExtension("ms-vscode.cpptools");
	if(!extPy){
		vscode.window.showErrorMessage("You must have the official Python extension to use this debugger!");
		return;
	}
	if(!extCpp){
		vscode.window.showErrorMessage("You must have the official C++ extension to use this debugger!");
		return;
	}
	if(!extPy.isActive){
		await extPy.activate();
	}
	if(!extCpp.isActive){
		await extCpp.activate();
	}
			
	activatePythonCppDebug(context);
	
}

export function deactivate() {
	
}


