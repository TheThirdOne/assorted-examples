String recognizer for "a*bb* | aa*bc* | ef" from comment on https://www.youtube.com/watch?v=qK0vmuQib8Y

Required settings, 8 bit cells, \0 after end of input 

Psuedocode:
  check if first character is e
    if so check if f and terminate
    else nom a's and keep a boolean of if we had one at least
      nom a "b" or fail
      check next character if \0 terminate
      if b
        nom b's till the end or fail
      if c and flag
        nom c's until end
      otherwise fail

set success flag: +>
input subtract a: ,>+++++ +++++[-<----- ----->]<+++
input subtract e: ----
if e            : >+<[++++[->>+<<]>>----<-<]>[-                    
    input subtract a: ,>+++++ +++++[-<----- ----->]<+++
    input subtract f: -----
    if !f fail      : [[-]<<+[[-],]>>]
    fail if not end : ,[[-]<<+[[-],]>>]
end ef case     :]
start first else:>[++++[-<+>]<
    while a         : >+<[[->>+<<]>-<]>[-
    set found a     : <<[-]+
    input subtract a: >,>+++++ +++++[-<----- ----->]<+++
    check if a      : >+<[[->>+<<]>-<]>
    end while a     : ]
    nom a "b"       : >[-[<<<<+[[-],]>>>>[-]]]
    if notfailed    : <<<<[->>+>+<<<]>>[-<<+>>]>[-
    if end success: : ,[
        subtract 'b': >+++++ +++++[-<----- ----->]<++
        if not b    : [>+<
          if not c fail : -[<<<->->>[-]]
          if no a fail  : <<-[+<[-]>+[[-],]>>>-<<<]>>
          if still possible:<<<[->+>+<<]>[-<+>]>[-
              while input: ,[
              subtract c : >+++++ +++++[-<----- ----->]<+
              fail if not 0: [<<[-]>>[[-],]>>-<<]
              endwhile   :,] 
          end nom c      :]>
          prep else      :
        end if not b: ]
        clear a flag: <<[-]>>
        if b        :>-[+
          if still possible:<<<<[->+>+<<]>[-<+>]>[-
              while input: ,[
              subtract b : >+++++ +++++[-<----- ----->]<++
              fail if not 0: [<<[-]>>[[-],]>>-<<]
              endwhile   :,] 
          end nom b      :]>>]<  
    end success check:]
    end failed test:]
end first else:]<<<
accept: >[-]>[-]+<<[---[----->+<]>-----.++..++.+++++++++++.++++.[-]>-<<]>>
reject: [-+>[-]>[-]<<[--------->++<]>.-------------.+++++.-----.--.-[--->+<]>--.[-]<<]<<
