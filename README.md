# Assembly-to-Machine-Code-Converter
A basic code converter that converts a watered down assembly code to Machine code. The program implements the knowledge learned from "CSE 3201: Computer Architecture and Design" course. The allowed operation types are immediate mode, register mode and branching mode; memory instructions are not yet implemented.

Instruction Type: 2 bit;
Instruction: 4 bit;

Branching Mode: 10
branchingInstructions = {
  JMP: "0000",
  JE: "0001",
  JNE: "0010",
  JL: "0011",
  JLE: "0100",
  JG: "0101",
  JGE: "0110",
  JC: "0111",
  JNC: "1000",
  JZ: "1001",
  JNZ: "1010",
  JMPREG: "1011",
};

Register Mode: 00, Immediate Mode: 01
arithmeticInstructions = {
  AND: "0000",
  OR: "0001",
  XOR: "0010",
  SHL: "0011",
  SHR: "0100",
  ADD: "0101",
  SUB: "0110",
  MUL: "0111",
  ROL: "1000",
  ROR: "1001",
  NOT: "1010",
  CMP: "1011",
  DIV: "1100",
};
