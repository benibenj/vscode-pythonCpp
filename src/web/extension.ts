/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import { activatePythonCppDebug } from '../activatePythonCppDebug';

export function activate(context: vscode.ExtensionContext) {
	activatePythonCppDebug(context);
}

export function deactivate() {
	// nothing to do
}
