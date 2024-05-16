import { useEffect, useState } from "react";
import "./App.css";

// dictionary to map instruction mnemonics to machine code
const branchingInstructions = {
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
const arithmeticInstructions = {
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

function App() {
  const [addressBit, setAddressBit] = useState(7);
  const [register, setRegister] = useState(3);
  const [cpu, setCPU] = useState(4);
  const [isa, setISA] = useState(13);

  const [dir, setDir] = useState(1);
  const [pa, setPa] = useState(Array(Math.pow(2, register)).fill(0));
  const [pf, setPf] = useState(Array(4).fill(0));
  const [pi, setPi] = useState([]);

  const [cf, setCf] = useState(0);
  const [sf, setSf] = useState(0);
  const [zf, setZf] = useState(1);
  const [of, setOf] = useState(0);
  const [a, setA] = useState(Array(Math.pow(2, register)).fill(0));

  const [machineCode, setMachineCode] = useState("");
  const [x86Code, setX86Code] = useState("xor a1, a1");
  const [xcode, setXcode] = useState([]);
  const [i, setI] = useState(0);

  useEffect(() => {
    let lg = [1 * cpu + 1 * register, 2 * register, 1 * addressBit, 1];
    lg.sort((a, b) => b - a); // Sort the array numerically
    setISA(lg[0] + 6);
    setI(0);
    setA(Array(Math.pow(2, register)).fill(0));
    setPa([]);
  }, [addressBit, register, cpu]);

  let lineNo = -1;
  let labels = {};

  useEffect(() => {
    setI(0);
    setA(a.fill(0));
    setCf(0);
    setOf(0);
    setZf(0);
    setSf(0);

    setPa([]);
    setPf([]);
    setPi([]);
  }, [x86Code]);

  useEffect(() => {
    try {
      lineNo = -1;
      labels = {};

      x86Code.split("\n").forEach((line) => {
        lineNo++;
        let x = line.split(/[ ,:]/).filter(Boolean);
        try {
          if (x.length === 4 || x[0].includes(":")) {
            // label
            let label = x[0];
            labels[label] = lineNo;
            x = x.slice(1);
          }
        } catch (error) {
          console.log(error, "<-label error");
        }
      });
      lineNo = -1;
      setMachineCode("");
      setXcode([]);
      x86Code.split("\n").forEach((line) => {
        setXcode((xcode) => {
          const updatedXcode = [...xcode]; // Make a copy of the current state array
          updatedXcode.push(line.toUpperCase()); // Push the new line into the copied array
          return updatedXcode; // Return the updated array to update the state
        });
        lineNo++;
        let x = line.split(/[ ,:]/).filter(Boolean);
        try {
          if (x.length === 4 || x[0].includes(":")) {
            // label
            let label = x[0];
            labels[label] = lineNo;
            x = x.slice(1);
          }

          if (x.length === 2) {
            // Branching instructions: jg main, jmp label
            // setMachineCode((prev) => prev + "10 ");
            let codeline = "10 ";

            codeline += branchingInstructions[x[0].toUpperCase()] + " ";
            if (!isNaN(x[1][1])) {
              // if it is a register, jmpreg a4
              let z = a[parseInt(x[1][1])];
              z = z.toString(2);
              while (z.length < addressBit) {
                z = "0" + z;
              } //padStart(addressBit, "0") does the same work.
              codeline += z + " ";
              codeline = codeline.padEnd(isa + 3, "0") + "\n";
            } else if (!isNaN(labels[x[1]])) {
              //add address instead of label
              let z = parseInt(labels[x[1]]);
              z = z.toString(2);
              while (z.length < addressBit) {
                z = "0" + z;
              } //padStart(addressBit, "0") does the same work.
              // setMachineCode((prev) => prev + z + "\n");
              codeline += z + " ";
              codeline = codeline.padEnd(isa + 3, "0") + "\n";
            } else {
              // setMachineCode((prev) => prev + "undefined\n");
              codeline += "undefined\n";
            }
            setMachineCode((prev) => prev + codeline);
          } else if (x.length === 3) {
            // Arithmetic instructions: ADD R1, R2
            // setMachineCode((prev) => {
            //   return prev + (isNaN(x[2]) ? "00 " : "01 ");
            // });
            let codeline = isNaN(x[2]) ? "00 " : "01 ";

            codeline += arithmeticInstructions[x[0].toUpperCase()] + " ";
            //reg1
            let z = parseInt(x[1][1]);
            z = z.toString(2);
            while (z.length < register) {
              z = "0" + z;
            }
            codeline += z + " ";

            if (isNaN(x[2])) {
              //a4, reg2
              let z = x[2][1];
              z = parseInt(z);
              z = z.toString(2);
              while (z.length < register) {
                z = "0" + z;
              } //padStart(register, "0") does the ame work.
              // setMachineCode((prev) => prev + z + " 0\n");
              codeline += z + " ";
              codeline = codeline.padEnd(isa + 4, "0") + "\n";
            } else {
              //4
              let z = parseInt(x[2]);
              z = z.toString(2).padStart(cpu, "0");
              codeline += z + " ";
              codeline = codeline.padEnd(isa + 4, "0") + "\n";
            }
            setMachineCode((prev) => prev + codeline);
          }
        } catch (error) {
          console.log(error);
        }
      });
      let insts = [];
      machineCode.split("\n").forEach((line) => insts.push(line.split(" ")));
      const opcode = insts[i][1];
      const operand1 = parseInt(insts[i][2], 2);
      const operand2 = parseInt(insts[i][3], 2);
      if (insts[i][0] === "00") {
        // Register Mode; Arithmetic instruction
        switch (opcode) {
          case arithmeticInstructions.AND:
            a[operand1] = a[operand1] & a[operand2];
            break;
          case arithmeticInstructions.OR:
            a[operand1] = a[operand1] | a[operand2];
            break;
          case arithmeticInstructions.XOR:
            a[operand1] = a[operand1] ^ a[operand2];
            break;
          case arithmeticInstructions.SHL:
            a[operand1] = a[operand1] << a[operand2];
            break;
          case arithmeticInstructions.SHR:
            a[operand1] = a[operand1] >> a[operand2];
            break;
          case arithmeticInstructions.ADD:
            a[operand1] = a[operand1] + a[operand2];
            break;
          case arithmeticInstructions.SUB:
            a[operand1] = a[operand1] - a[operand2];
            break;
          case arithmeticInstructions.MUL:
            a[operand1] = a[operand1] * a[operand2];
            break;
          case arithmeticInstructions.ROL:
            a[operand1] =
              (a[operand1] << a[operand2]) |
              (a[operand1] >> (cpu - a[operand2]));
            break;
          case arithmeticInstructions.ROR:
            a[operand1] =
              (a[operand1] >> a[operand2]) |
              (a[operand1] << (cpu - a[operand2]));
            break;
          case arithmeticInstructions.NOT:
            a[operand1] = ~a[operand1];
            break;
          case arithmeticInstructions.CMP:
            {
              let temp = a[operand1] - a[operand2];
              setOf(0);
              setCf(temp >= Math.pow(2, cpu) || temp < 0 ? 1 : 0);
              setZf(temp === 0 ? 1 : 0);
              temp = temp < 0 ? Math.pow(2, cpu) + temp : temp;
              setSf(
                temp
                  .toString(2)
                  .slice(-1 * cpu)
                  .padStart(cpu, "0")[0]
              );
            }
            break;
          case arithmeticInstructions.DIV:
            if (a[operand1] < a[operand2]) console.alert("Division Error!");
            a[operand1] = Math.floor(a[operand1] / a[operand2]);
            break;
          default:
            // Unknown opcode
            break;
        }
        if (opcode !== arithmeticInstructions.CMP) {
          setOf(
            Math.abs(a[operand1]) !==
              Math.abs(parseInt(a[operand1].toString(2).slice(-1 * cpu), 2))
              ? 1
              : 0
          );

          if (a[operand1] < 0) {
            setCf(1);
          } else if (a[operand1] > Math.pow(2, cpu) - 1) {
            setCf(1);
          } else setCf(0);
          // console.log(a[operand1], cf);
          setZf(a[operand1] === 0 ? 1 : 0);
          a[operand1] =
            a[operand1] < 0 ? Math.pow(2, cpu) + a[operand1] : a[operand1];
          setSf(
            a[operand1]
              .toString(2)
              .slice(-1 * cpu)
              .padStart(cpu, "0")[0]
          );
        }
        a[operand1] = parseInt(a[operand1].toString(2).slice(-1 * cpu), 2);
        a[operand1] = Math.abs(a[operand1]);
      } else if (insts[i][0] === "01") {
        // Arithmetic instruction
        switch (opcode) {
          case arithmeticInstructions.AND:
            a[operand1] = a[operand1] & operand2;
            break;
          case arithmeticInstructions.OR:
            a[operand1] = a[operand1] | operand2;
            break;
          case arithmeticInstructions.XOR:
            a[operand1] = a[operand1] ^ operand2;
            break;
          case arithmeticInstructions.SHL:
            a[operand1] = a[operand1] << operand2;
            break;
          case arithmeticInstructions.SHR:
            a[operand1] = a[operand1] >> operand2;
            break;
          case arithmeticInstructions.ADD:
            a[operand1] = a[operand1] + operand2;
            break;
          case arithmeticInstructions.SUB:
            a[operand1] = a[operand1] - operand2;
            break;
          case arithmeticInstructions.MUL:
            a[operand1] = a[operand1] * operand2;
            break;
          case arithmeticInstructions.ROL:
            a[operand1] =
              (a[operand1] << operand2) | (a[operand1] >> (cpu - operand2));
            break;
          case arithmeticInstructions.ROR:
            a[operand1] =
              (a[operand1] >> operand2) | (a[operand1] << (cpu - operand2));
            break;
          case arithmeticInstructions.NOT:
            a[operand1] = ~a[operand1];
            break;
          case arithmeticInstructions.CMP:
            {
              let temp = a[operand1] - operand2;
              setOf(
                0
                // Math.abs(temp) !==
                //   Math.abs(parseInt(temp.toString(2).slice(-cpu), 2))
                //   ? 1
                //   : 0
              );
              setCf(temp >= Math.pow(2, cpu) || temp < 0 ? 1 : 0);
              setZf(temp === 0 ? 1 : 0);
              temp = temp < 0 ? Math.pow(2, cpu) + temp : temp;
              setSf(
                temp
                  .toString(2)
                  .slice(-1 * cpu)
                  .padStart(cpu, "0")[0]
              );
            }
            break;
          case arithmeticInstructions.DIV:
            if (a[operand1] < operand2) console.alert("Division Error!");
            a[operand1] = Math.floor(a[operand1] / operand2);
            break;
          default:
            // Unknown opcode
            break;
        }
        if (opcode !== arithmeticInstructions.CMP) {
          setOf(
            Math.abs(a[operand1]) !==
              Math.abs(parseInt(a[operand1].toString(2).slice(-1 * cpu), 2))
              ? 1
              : 0
          );

          if (a[operand1] < 0) {
            setCf(1);
          } else if (a[operand1] > Math.pow(2, cpu) - 1) {
            setCf(1);
          } else setCf(0);
          setZf(a[operand1] === 0 ? 1 : 0);
          a[operand1] =
            a[operand1] < 0 ? Math.pow(2, cpu) + a[operand1] : a[operand1];
          setSf(
            a[operand1]
              .toString(2)
              .slice(-1 * cpu)
              .padStart(cpu, "0")[0]
          );
        }
        a[operand1] = parseInt(a[operand1].toString(2).slice(-1 * cpu), 2);
        a[operand1] = Math.abs(a[operand1]);
      } else if (insts[i][0] === "10") {
        switch (opcode) {
          case branchingInstructions.JMP:
            setI(operand1);
            break;
          case branchingInstructions.JE:
            setI(zf === 1 && sf === 0 ? operand1 : i);
            break;
          case branchingInstructions.JNE:
            setI(zf === 0 ? operand1 : i);
            break;
          case branchingInstructions.JL:
            setI(sf === 1 ? operand1 : i);
            break;
          case branchingInstructions.JLE:
            setI((sf | zf) === 1 ? operand1 : i);
            break;
          case branchingInstructions.JG:
            setI((sf | zf) === 0 ? operand1 : i);
            break;
          case branchingInstructions.JGE:
            setI(sf === 0 || zf === 1 ? operand1 : i);
            break;
          case branchingInstructions.JC:
            setI(cf === 1 ? operand1 : i);
            break;
          case branchingInstructions.JNC:
            setI(cf === 0 ? operand1 : i);
            break;
          case branchingInstructions.JZ:
            setI(zf === 1 ? operand1 : i);
            break;
          case branchingInstructions.JNZ:
            setI(zf === 0 ? operand1 : i);
            break;
          case branchingInstructions.JMPREG:
            setI(a[operand1]);
            break;
          default:
            break;
        }
      }

      if (dir === -1) {
        setA(pa[pa.length - 1]);
        setCf(pf[pf.length - 1][0]);
        setSf(pf[pf.length - 1][1]);
        setOf(pf[pf.length - 1][2]);
        setZf(pf[pf.length - 1][3]);

        setPa((prevPa) => [...prevPa.slice(0, -1)]);

        setPf((prevPf) => [...prevPf.slice(0, -1)]);

        setPi((prevPi) => [...prevPi.slice(0, -1)]);
      }
      setDir(1);
    } catch (error) {
      console.log(error);
    }
  }, [x86Code, i, addressBit, register, cpu, isa]);

  function goForward() {
    if (i < xcode.length - 1) {
      setPa((prev) => [...prev, [...a]]);
      setPf((prev) => [...prev, [cf, sf, of, zf]]);
      setPi((prev) => [...prev, i]);
      setI((prev) => prev + 1);
    } else {
      console.log("End of the program\n", pi.length);
    }
  }

  function goBack() {
    if (pi.length > 0) {
      setDir(-1);
      setI(pi[pi.length - 1]);
    } else console.log("No more steps to go back");
  }

  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let intervalId;
    let timeoutId;

    if (isRunning) {
      // Start the timer if running==true
      intervalId = setInterval(() => {
        goForward();
        console.log("Timer tick");
      }, 1000);

      // Set a timeout to clear the interval after 25 seconds
      timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        setIsRunning(false);
        console.log("Timer stopped=25");
      }, 25000); // 25 seconds, 25 loop
    } else {
      // Clear the interval and the timeout if isRunning is false
      console.log("Timer stopped");
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    }

    // Cleanup function to clear the interval and timeout when the component unmounts or when isRunning changes
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [isRunning]);

  // Function to start the timer
  function startTimer() {
    setIsRunning(true);
  }

  // Function to stop the timer
  function stopTimer() {
    setIsRunning(false);
  }
  let arr = machineCode.split("\n");
  arr.pop();

  return (
    <div className="bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% min-h-[100vh] w-[100vw]">
      <p className="italic p-2 m-auto font-serif w-[50vw]">
        <label htmlFor="cpu">CPU:</label>
        <input
          type="number"
          id="cpu"
          value={cpu}
          onChange={(e) =>
            parseInt(e.target.value) > 0 ? setCPU(e.target.value) : 1
          }
          className="bg-inherit border border-white text-gray-800 px-2 mx-2 w-[5vw]"
        />
        <label htmlFor="register">Register:</label>
        <input
          type="number"
          id="register"
          value={register}
          onChange={(e) =>
            parseInt(e.target.value) > 0 ? setRegister(e.target.value) : 1
          }
          className="bg-inherit border border-white text-gray-800 px-2 mx-2 w-[5vw]"
        />
        <label htmlFor="addressBit">Address Bit:</label>
        <input
          type="number"
          id="addressBit"
          value={addressBit}
          onChange={(e) =>
            parseInt(e.target.value) > 0 ? setAddressBit(e.target.value) : 1
          }
          className="bg-inherit border border-white text-gray-800 px-2 mx-2 w-[5vw]"
        />
        <label htmlFor="addressBit">ISA size (Bit):</label>
        <input
          type="number"
          id="addressBit"
          value={isa}
          // onChange={(e) =>
          //   parseInt(e.target.value) > isa ? setISA(e.target.value) : isa
          // }
          className="bg-inherit border border-white text-gray-800 px-2 mx-2 w-[5vw]"
        />
      </p>

      <div className="min-h-[85vh] font-mono m-auto">
        <div className="flex w-full p-2 m-auto space-x-1">
          <div className="w-1/3 min-h-[80vh]">
            <label htmlFor="x86Code">Input</label>
            <textarea
              id="x86Code"
              name="x86Code"
              value={x86Code}
              onChange={(e) => setX86Code(e.target.value)}
              className="h-[100%] w-[100%] border border-white bg-indigo-200 bg-opacity-20 focus:border-red-500 focus:ring-0 text-gray-800 font-semibold text-xl tracking-wider p-2"
              autoFocus
            />
          </div>

          <div className="w-1/3 min-h-[80vh]">
            <label htmlFor="x86Code">x13 code</label>
            <div
              className="h-[100%] w-[100%] bg-inherit border backdrop-blur-sm text-xl text-gray-800 tracking-wider p-2"
              name="machineCode"
            >
              {xcode.map((line, index) => {
                let x;
                try {
                  x = line.split(/[ ,:]/).filter(Boolean);
                } catch (error) {
                  console.log(error);
                }

                const isCurrentLine = index === i;
                const hasFourParts = x && x.length === 4;

                return (
                  <div
                    className={`flex ${isCurrentLine ? "bg-indigo-200" : ""}`}
                    key={index}
                  >
                    <p className="w-[20%]">{hasFourParts ? x[0] + ":" : ""}</p>
                    <p>
                      {hasFourParts ? ` ${line.slice(x[0].length + 1)}` : line}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-1/3 min-h-[80vh]">
            <label htmlFor="machineCode">Machine Code</label>
            <div
              className="h-[100%] w-[100%] bg-inherit border text-xl text-gray-800 tracking-wider p-2"
              name="machineCode"
            >
              {arr.map((line, index) => {
                return (
                  <p key={index} className={index === i ? "bg-indigo-200" : ""}>
                    &nbsp;
                    {line && index.toString(2).padStart(addressBit, "0") + ":"}
                    &nbsp;&nbsp;&nbsp;
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-1 font-serif justify-center bg-inherit overflow-auto whitespace-normal max-w-[100vw]">
        <button
          onClick={goForward}
          className="bg-teal-200 border-2 border-red-200 hover:bg-blue-50 m-2 px-2"
        >
          <svg fill="#f90000" viewBox="0 0 57 57" width={30}>
            <path
              d="M56.575,27.683l-27-19c-0.306-0.216-0.703-0.242-1.036-0.07C28.208,8.784,28,9.127,28,9.5v17.777L1.575,8.694
	C1.27,8.481,0.872,8.453,0.539,8.625C0.208,8.797,0,9.14,0,9.513v37.975c0,0.373,0.208,0.716,0.539,0.888
	C0.685,48.45,0.843,48.487,1,48.487c0.202,0,0.403-0.062,0.575-0.182L28,29.723V47.5c0,0.373,0.208,0.716,0.539,0.888
	C28.685,48.463,28.843,48.5,29,48.5c0.202,0,0.404-0.062,0.575-0.183l27-19C56.842,29.131,57,28.825,57,28.5
	S56.842,27.869,56.575,27.683z M2,45.562V11.439L26.262,28.5L2,45.562z M30,45.573V11.427L54.263,28.5L30,45.573z"
            />
          </svg>
        </button>
        <button
          onClick={goBack}
          className="bg-pink-200 border-2 border-teal-300 hover:bg-blue-50 m-2 px-2"
        >
          <svg
            fill="#f90fe8"
            viewBox="0 0 57 57"
            width={30}
            transform="rotate(180)"
          >
            <path
              d="M56.575,27.683l-27-19c-0.306-0.216-0.703-0.242-1.036-0.07C28.208,8.784,28,9.127,28,9.5v17.777L1.575,8.694
	C1.27,8.481,0.872,8.453,0.539,8.625C0.208,8.797,0,9.14,0,9.513v37.975c0,0.373,0.208,0.716,0.539,0.888
	C0.685,48.45,0.843,48.487,1,48.487c0.202,0,0.403-0.062,0.575-0.182L28,29.723V47.5c0,0.373,0.208,0.716,0.539,0.888
	C28.685,48.463,28.843,48.5,29,48.5c0.202,0,0.404-0.062,0.575-0.183l27-19C56.842,29.131,57,28.825,57,28.5
	S56.842,27.869,56.575,27.683z M2,45.562V11.439L26.262,28.5L2,45.562z M30,45.573V11.427L54.263,28.5L30,45.573z"
            />
          </svg>
        </button>
        <button
          onClick={startTimer}
          className={
            isRunning
              ? "bg-blue-200 border-2 border-red-600 m-2 px-2 hover:bg-blue-400"
              : "bg-cyan-200 border-2 border-sky-400 m-2 px-2 hover:bg-blue-50"
          }
        >
          <svg viewBox="0 0 16 16" width={30} fill="#0055e0">
            <path
              d="M6,11 L11,8 L6,5 L6,11 Z M8,14.6 C4.4,14.6 1.4,11.6 1.4,8 C1.4,4.4 4.4,1.4 8,1.4 C11.6,1.4 14.6,4.4 
              14.6,8 C14.6,11.6 11.6,14.6 8,14.6 L8,14.6 Z M8,0 C3.6,0 0,3.6 0,8 C0,12.4 3.6,16 8,16 C12.4,16 16,12.4 16,8 C16,3.6 12.4,0 8,0 L8,0 Z"
              id="Fill-1"
            ></path>
          </svg>
        </button>
        <button
          onClick={stopTimer}
          className="bg-blue-300 border-2 border-blue-600 hover:bg-blue-50 m-2 px-2"
        >
          <svg width={30} viewBox="0 0 24 24" fill="none">
            <path
              d="M8 9.5C8 9.03406 8 8.80109 8.07612 8.61732C8.17761 8.37229 8.37229 8.17761 8.61732 8.07612C8.80109 8 9.03406 8 9.5 8C9.96594 8 10.1989 8 10.3827 8.07612C10.6277 8.17761 10.8224 8.37229 10.9239 8.61732C11 8.80109 11 9.03406 11 9.5V14.5C11 14.9659 11 15.1989 10.9239 15.3827C10.8224 15.6277 10.6277 15.8224 10.3827 15.9239C10.1989 16 9.96594 16 9.5 16C9.03406 16 8.80109 16 8.61732 15.9239C8.37229 15.8224 8.17761 15.6277 8.07612 15.3827C8 15.1989 8 14.9659 8 14.5V9.5Z"
              stroke="#e02700"
              strokeWidth="1.5"
            />
            <path
              d="M13 9.5C13 9.03406 13 8.80109 13.0761 8.61732C13.1776 8.37229 13.3723 8.17761 13.6173 8.07612C13.8011 8 14.0341 8 14.5 8C14.9659 8 15.1989 8 15.3827 8.07612C15.6277 8.17761 15.8224 8.37229 15.9239 8.61732C16 8.80109 16 9.03406 16 9.5V14.5C16 14.9659 16 15.1989 15.9239 15.3827C15.8224 15.6277 15.6277 15.8224 15.3827 15.9239C15.1989 16 14.9659 16 14.5 16C14.0341 16 13.8011 16 13.6173 15.9239C13.3723 15.8224 13.1776 15.6277 13.0761 15.3827C13 15.1989 13 14.9659 13 14.5V9.5Z"
              stroke="#e02700"
              strokeWidth="1.5"
            />
            <path
              d="M7 3.33782C8.47087 2.48697 10.1786 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 10.1786 2.48697 8.47087 3.33782 7"
              stroke="#e02700"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {a.map((x, index) => (
          <div className="flex border m-2 p-2 space-x-2">
            <p>a{index}:</p>
            <i>{x}</i>
          </div>
        ))}
        <div className="flex border m-2 p-2 space-x-2">
          <p>CF:</p>
          <i>{cf}</i>
        </div>
        <div className="flex border m-2 p-2 space-x-2">
          <p>SF:</p>
          <i>{sf}</i>
        </div>
        <div className="flex border m-2 p-2 space-x-2">
          <p>ZF:</p>
          <i>{zf}</i>
        </div>
        <div className="flex border m-2 p-2 space-x-2">
          <p>OF:</p>
          <i>{of}</i>
        </div>
        <div className="flex border m-2 p-2 space-x-2">
          <p>Crnt Index:</p>
          <i>{i < 0 ? 0 : i}</i>
        </div>
        <div className="flex border m-2 p-2 space-x-2 w-72">
          <p>Crnt Instruction:</p>
          <i>{xcode.length > 0 && xcode[i < 0 ? 0 : i]}</i>
        </div>
      </div>
    </div>
  );
}

export default App;
