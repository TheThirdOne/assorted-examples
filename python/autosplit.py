import keyboard
import ptrace.debugger
import signal
import subprocess
import sys

def trigger(before,after):
    if after > before:
        print(before,after)
        keyboard.press_and_release('insert')
    return max(before,after)
def main():
    pid = int(sys.argv[1])
    debugger = ptrace.debugger.PtraceDebugger()
    process = debugger.addProcess(pid, False)
    
    current = process.readBytes(0x9024a00, 1)[0] 
    try:
        while (True):
            b = process.createBreakpoint(0x08344971);
            process.cont()
            s = process.waitSignals(signal.SIGTRAP,signal.SIGPWR,signal.SIGXCPU)
            while s.signum != signal.SIGTRAP:
                print("signal ",s,flush=True);
                process.cont(s.signum)
                s = process.waitSignals(signal.SIGTRAP,signal.SIGPWR,signal.SIGXCPU)
            b.desinstall(True)
            process.singleStep();
            s = process.waitSignals(signal.SIGTRAP)
            after = process.readBytes(0x9024a00, 1)
            current = trigger(current,after[0])
    except KeyboardInterrupt:
        process.kill(signal.SIGSTOP)
        s = process.waitSignals(signal.SIGSTOP)
        b.desinstall()
        process.cont()
        
main()
