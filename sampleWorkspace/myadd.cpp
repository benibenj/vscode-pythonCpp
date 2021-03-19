#include "myadd.hpp"

extern "C" _declspec(dllexport) int add(int x, int y){
    int z = x + y;
    return z;
}