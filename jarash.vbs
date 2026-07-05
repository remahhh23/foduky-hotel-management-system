Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(WScript.ScriptFullName)
ws = CreateObject("WScript.Shell")
ws.CurrentDirectory = root
ws.Run "cmd /c node """ & root & "\serve.cjs""", 0, False
WScript.Sleep 1500
ws.Run "cmd /c start http://localhost:3000", 1, False
