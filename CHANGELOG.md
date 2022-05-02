## 0.2.18
* Passes Python process ID to `pid` of C++ config for other C++ debuggers

## 0.2.11 - 0.2.17
* Minor changes and bug fixes

## 0.2.10
* Added a new Quickpick option for default configurations
* Added a default configuration to the `Add Configuration` results in the launch.json file
* Changed the attribute value of `pythonConfig` and `cppConfig` from `manual` to `custom`

## 0.2.9
* Changed Name from `Python C++ Debug` to `Python C++ Debugger` for improved Marketplace search results
* Small fixes
* Internal Design changes
* Added the attribute `optimizedLaunch`

## 0.2.8
* Added default configurations for python and C++ by setting the attributes `pythonConfig` and `cppConfig`
* Added the attributes `entireCppConfig` and `entirePythonConfig` which if defined start the debugger with the configuration passed to the attribute

## 0.2.4 - 0.2.7
* Fixing Github Repo links
* Small fixes
* ProcessId of gdb/windows attach will be set to empty string due to problems with commands in the configuration for C++
* Improved configuration provider

## 0.2.3
* Changing new name in package.json for configurations

## 0.2.2
* Removing restart keybinding as it isn't supported at the moment
* Changed Displayname from `PythonCpp Debug` to `Python C++ Debug` for better search results in the marketplace
* Added Keywords for better search results in the marketplace

## 0.2.1
* Added changelog
* Added topics to Readme.md
* Added Initial Configuration Provider for when there is no launch.json file
* Changed Keybinding for restart, however restart isn't supported at the moment. It will stop stop the session of the debugger.
* If the C++ debugger fails to start it will terminate the python debugger that it started.
* Other minor patches

## 0.2.0
* Updated Icon.png to higher resolution

## 0.1.1
* Added Icon.png
* Small fixes and cleanup

## 0.1.0
* Published for testing
