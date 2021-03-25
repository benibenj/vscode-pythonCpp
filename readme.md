# VS Code Python C++ Debug

This debugger starts a python debugger and attaches a C++ debugger to it for debugging python code that calls functions from shared object files (.so/.dll).

![vscode-pythonCpp example](images/pythonCppExample.gif)

## Python C++ Debug Requirements

To use this debug-extension you must have the following extensions installed:
* Python by Microsoft (ms-python.python)
* C/C++ by Microsoft (ms-vscode.cpptools)

## Launch.json

To use this extension you must have the following 3 configurations in your launch.json file
* C/C++ attach config e.g. Windows: `(Windows) Attach`, Linux: `(gdb) Attach`
* Python launch config
* Python C++ Debug config with the following attributes:
  - **pythonLaunchName**: The name of your C++ Attach configuration
  - **cppAttachName**: The name of your Python Launch configuration

 The following is an example launch.json file for windows users. If your working on Linux make sure to have a `(gdb) Attach` configuration instead of `(Windows) Attach`.

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "(Windows) Attach",
      "type": "cppvsdbg",
      "request": "attach",
      "processId": ""
    },
    {
      "name": "Python C++ Debug",
      "type": "pythoncpp",
      "request": "launch",
      "pythonLaunchName": "Python: Current File",
      "cppAttachName": "(Windows) Attach",
    },
    {
      "name": "Python: Current File",
      "type": "python",
      "request": "launch",
      "program": "${file}",
      "console": "integratedTerminal"
    }
  ]
}

```

## What the debugger does

When you start Python C++ Debug it launches a Python debugger and attaches a C++ debugger to it by using the processId of the python debugger. As soon as both debuggers are attached the Python C++ debugger terminates.

## Additional information
* Make sure the shared object files (.so/.dll) you are loading your functions from have been compiled with `debug info`.
* Between consecutive `breakpoints` where one is located in python and the other in the C++ code, only the 'continue' button will work correctly.
* Additionally, the `restart button` isn't supported due to the Python debugger changing its processId after a restart. 
