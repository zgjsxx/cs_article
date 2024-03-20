
# pipe

## PeekNamedPipe
```cpp
// Get data size available from pipe
DWORD bytesAvail = 0;
BOOL isOK = PeekNamedPipe(hPipe, NULL, 0, NULL, &bytesAvail, NULL);
if(!isOK)
{
   // Check GetLastError() code
}

// Allocate buffer and peek data from pipe
DWORD bytesRead = 0;    
std::vector<char> buffer(bytesAvail);
isOK = PeekNamedPipe(hPipe, &buffer[0], bytesAvail, &bytesRead, NULL, NULL);
if(!isOK)
{
   // Check GetLastError() code
}
```