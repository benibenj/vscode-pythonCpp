import ctypes
import pathlib

if __name__ == "__main__":
    myadd_path = "\\Users\\Benjamin\\Documents\\Code\\Debugger_pycpp\\python_cpp\\libmyadd.so"
    myadd = ctypes.CDLL(myadd_path)
    a = 8
    b = 7
    print(f'adding {a} and {b} together')
    result = myadd.add(a,b)
    print(result)