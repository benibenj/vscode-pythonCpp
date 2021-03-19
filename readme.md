# VS Code PythonCpp Debug

This debugger starts a python debugger and attaches a C++ debugger to it for debugging python code that calls functions from shared object files (.so/.dll).


## PythonCpp Debug Requirements

To use this debug-extension you must have the following extensions installed:
* Python by Microsoft (ms-python.python)
* C/C++ by Microsoft (ms-vscode.cpptools)

## Launch.json

To use this extension you must have the following 3 configurations in your launch.json file
* C/C++ attach config e.g. Windows: (Windows) Attach, Linux: (gdb) Attach
* Python launch config
* PythonCpp Debug config with the following attributes:
  - **pythonLaunchName**: The name of your C/C++ Attach configuration
  - **cppAttachName**: The name of your Python Launch configuration

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
      "name": "PythonCpp Debug",
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

## Additional infromation

Between consecutive breakpoints where one is located in python and the other in the C++ code, only the 'continue' button will work correctly.
Additionally, the reset button isn't supported due to the Python debugger changing its processId after a restart. 