import ctypes
import pathlib

if __name__ == "__main__":
    myadd_path = ".\\myadd.dll"
    myadd = ctypes.CDLL(myadd_path)
    a = 8
    b = 7
    print(f'adding {a} and {b} together')
    result = myadd.add(a,b)
    print(result)