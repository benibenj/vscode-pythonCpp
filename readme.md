# VS Code PythonCpp Debug

This debuger starts a python debuger and attaches a C++ debuger to it for debuging python code that calls functions from shared object files (.so/.dll).

**PythonCpp Debug Requirements**

To use this debug-extension you must have the following extensions installed:
* Python by Microsoft (ms-python.python)
* C/C++ by Microsoft (ms-vscode.cpptools)

## Using PythonCpp Debug

### Launch.json

To use this extension you must have the following 3 configurations in you launch.json file
* C/C++ attach config e.g. Windows: (Windows) Attach, Linux: (gdb) Attach
* Python launch config
* PythonCpp Debug config with the following attributes:
 - pythonLaunchName: The name of your C++ Attach configuration
 - cppAttachName: The name of your Python Launch configuration

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
