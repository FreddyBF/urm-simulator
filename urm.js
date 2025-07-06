class UnlimitedRegisterMachine {
  constructor() {
    this.registers = [];
    this.instructions = [null];
    this.instructionPtr = 1;
    this.state = "stopped";
    this.executionHistory = [];
    this.MAX_REGISTERS = 1000;
    this.MAX_STEPS = 10000;
  }

  parseInstruction(instruction) {
    const cleanInst = instruction.replace(/\s+/g, '');
    const pattern = /^([ZSTJ])\(([\d,]+)\)$/;
    const match = cleanInst.match(pattern);
    if (!match)
      throw new Error(`Instrução mal formatada: ${instruction}. Exemplos: Z(1), S(2), T(1,2), J(1,2,3).`);
    
    const op = match[1];
    const args = match[2].split(',').map(Number);
    const argCount = { Z: 1, S: 1, T: 2, J: 3 };
    if (args.length !== argCount[op]) {
      throw new Error(
        `Operação ${op} requer ${argCount[op]} argumentos. Exemplo: ${op}(${Array(argCount[op]).fill('n').join(',')})`
      );
    }
    args.forEach(arg => {
      if (!Number.isInteger(arg) || arg < 1) {
        throw new Error(`Argumento inválido: ${arg}. Registradores devem ser inteiros ≥ 1.`);
      }
    });
    //Retorna as cleanInst-instrunçoes validas, args-argumentos
    return { original: cleanInst, op, args };
  }


  addInstruction(instruction) {
    //Remove os espacs bracos e verifica comentarios
    if (!instruction.trim() || instruction.trim().startsWith('//')) return;
    const parsedInst = this.parseInstruction(instruction);
    //Empinha as instrunçoes
    this.instructions.push(parsedInst);
  }

  compile(initialRegisters = []) {
    if (this.instructions.length <= 1) {
      throw new Error("Nenhuma instrução adicionada ao programa.");
    }
    this.registers = [];
    initialRegisters.forEach((val, i) => {
      if (i >= this.MAX_REGISTERS) {
        throw new Error(`Limite de registradores excedido (máx: ${this.MAX_REGISTERS}).`);
      }
      this.registers[i] = val ?? 0;
    });
    this.instructionPtr = 1;
    this.executionHistory = [];
    this.state = "compiled";
    return "Programa compilado com sucesso!";
  }

  executeStep() {
    if (this.state !== "compiled" && this.state !== "running") {
      throw new Error("Programa não compilado. Execute compile() primeiro.");
    }
    if (this.instructionPtr < 1 || this.instructionPtr >= this.instructions.length) {
      this.state = "stopped";
      return { 
        done: true, 
        message: "Execução concluída.", 
        registers: [...this.registers] 
      };
    }

    const currentInst = this.instructions[this.instructionPtr];
    const { op, args, original } = currentInst;

    const stepInfo = {
      instructionPtr: this.instructionPtr,
      instruction: original,
      registersBefore: [...this.registers],
      op,
      args: [...args]
    };

    try {
      switch (op) {
        case "Z": this.zero(args[0]); break;
        case "S": this.successor(args[0]); break;
        case "T": this.transfer(args[0], args[1]); break;
        case "J": this.jump(args[0], args[1], args[2]); break;
        default: throw new Error(`Operação desconhecida: ${op}`);
      }
    } catch (e) {
      stepInfo.error = `ERRO: ${e.message}`;
      this.executionHistory.push(stepInfo);
      this.state = "error";
      return { done: true, error: stepInfo.error };
    }

    stepInfo.registersAfter = [...this.registers];
    this.executionHistory.push(stepInfo);

    if (this.executionHistory.length > this.MAX_STEPS) {
      this.state = "error";
      throw new Error("Limite de passos excedido (possível loop infinito).");
    }

    return {
      done: (this.instructionPtr < 1 || this.instructionPtr >= this.instructions.length),
      stepInfo,
      registers: [...this.registers]
    };
  }

  executeAll() {
    if (this.state !== "compiled" && this.state !== "running") {
      throw new Error("Programa não compilado. Execute compile() primeiro.");
    }
    this.state = "running";
    const output = [];
    let result;
    do {
      result = this.executeStep();
      output.push(`Instrução ${result.stepInfo.instructionPtr}: ${result.stepInfo.instruction}`);
      output.push(`Registradores: ${this.registers.map((v, i) => `R${i+1}=${v}`).join(', ')}`);
    } while (!result.done);
    this.state = "stopped";
    return output.join('\n');
  }

  zero(n) {
    this.validateRegister(n);
    this.registers[n - 1] = 0;
    this.instructionPtr++;
  }

  successor(n) {
    this.validateRegister(n);
    this.registers[n - 1] = (this.registers[n - 1] ?? 0) + 1;
    this.instructionPtr++;
  }

  transfer(m, n) {
    this.validateRegister(m);
    this.validateRegister(n);
    this.registers[n - 1] = this.registers[m - 1] ?? 0;
    this.instructionPtr++;
  }

  jump(m, n, p) {
    this.validateRegister(m);
    this.validateRegister(n);
    const valM = this.registers[m - 1] ?? 0;
    const valN = this.registers[n - 1] ?? 0;
    this.instructionPtr = (valM === valN) ? 
      (p >= 1 && p < this.instructions.length ? p : this.instructions.length) : 
      this.instructionPtr + 1;
  }

  validateRegister(n) {
    if (!Number.isInteger(n) || n < 1) {
      throw new Error(`Registrador inválido: R${n}. Deve ser um inteiro ≥ 1.`);
    }
    if (n > this.MAX_REGISTERS) {
      throw new Error(`Limite de registradores excedido (R${n} > ${this.MAX_REGISTERS}).`);
    }
  }

  //método para reiniciar a máquina
  reset() {
    this.registers = [];
    this.instructions = [null];
    this.instructionPtr = 1;
    this.state = "stopped";
    this.executionHistory = [];
  }
}

