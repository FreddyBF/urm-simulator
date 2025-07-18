document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos da interface
    const urmCode = document.getElementById('urm-code');
    const initialRegisters = document.getElementById('initial-registers');
    const registersDisplay = document.getElementById('registers-display');
    const stateDisplay = document.getElementById('state');
    const nextInstruction = document.getElementById('next-instruction');
    const historyDisplay = document.getElementById('execution-history');

    //Exemplos selecionados
    const exampleSelect = document.getElementById('example-select');
    
    // Botões
    const compileBtn = document.getElementById('compile-btn');
    const stepBtn = document.getElementById('step-btn');
    const runBtn = document.getElementById('run-btn');
    const resetBtn = document.getElementById('reset-btn');

    // Instância da URM
    const urm = new UnlimitedRegisterMachine();
    // Exemplos de programas
    const examples = {
        soma: [
            "J(3,2,6) ",
            "S(1) ",
            "S(3)  ",
            "J(1,1,1) ",
            "Z(3)  "
        ],
        multiplicacao: [
  "Z(3)",
  "Z(5)",
  "J(5,2,13)",
  "Z(4)",
  "T(1,4)",
  "Z(6)",
  "J(6,4,11)",
  "S(3)",
  "S(6)",
  "J(1,1,7)",
  "S(5)",
  "J(1,1,3)",
  "T(3,1)"
],
        factorial: [
  "Z(2)",
  "S(2)",
  "Z(3)",
  "J(3,1,18)",
  "S(3)",
  "Z(4)",
  "Z(5)",
  "J(5,3,16)",
  "Z(6)",
  "J(6,2,14)",
  "S(4)",
  "S(6)",
  "J(1,1,10)",
  "S(5)",
  "J(1,1,8)",
  "T(4,2)",
  "J(1,1,4)",
  "T(2,1)"
],
potencia: [
    "T(2,4)",
    "J(1,3,16)",
    "J(2,5,11)",
    "J(4,6,8)",
    "S(7)",
    "S(6)",
    "J(1,1,4)",
    "S(5)",
    "Z(6)",
    "J(1,1,3)",
    "S(3)",
    "Z(5)",
    "T(7,2)",
    "Z(7)",
    "J(1,1,2)",
    "T(2,1)"
]


    };

    // Carregar exemplo selecionado
    exampleSelect.addEventListener('change', () => {
        const example = exampleSelect.value;
        if (example && examples[example]) {
            urmCode.value = examples[example].join('\n');
        }
    });

    // Atualizar display dos registradores
    function updateRegistersDisplay() {
        registersDisplay.innerHTML = '';
        urm.registers.forEach((value, index) => {
            const registerElement = document.createElement('div');
            registerElement.className = 'register';
            registerElement.innerHTML = `
                <div class="index">R${index + 1}</div>
                <div class="value">${value}</div>
            `;
            registersDisplay.appendChild(registerElement);
        });
    }

    // Atualizar histórico de execução
    function updateExecutionHistory() {
        historyDisplay.innerHTML = '';
        urm.executionHistory.forEach((step, idx) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            let details = `Instrução ${step.instructionPtr}: ${step.instruction}`;
            if (step.error) {
                details += ` - <span style="color:var(--danger)">${step.error}</span>`;
            } else {
                details += ` | Registradores: ${step.registersAfter.map((v, i) => `R${i+1}=${v}`).join(', ')}`;
            }
            
            historyItem.innerHTML = details;
            historyDisplay.appendChild(historyItem);
        });
        
        // Rolagem automática para o final
        historyDisplay.scrollTop = historyDisplay.scrollHeight;
    }

    // Atualizar estado da máquina
    function updateMachineState() {
        stateDisplay.textContent = urm.state;
        
        if (urm.state === 'running' || urm.state === 'compiled') {
            if (urm.instructionPtr >= 1 && urm.instructionPtr < urm.instructions.length) {
                const inst = urm.instructions[urm.instructionPtr];
                nextInstruction.textContent = `I${urm.instructionPtr}: ${inst.original}`;
            } else {
                nextInstruction.textContent = 'Programa terminado';
            }
        } else {
            nextInstruction.textContent = '-';
        }
    }

    // Compilar programa
    compileBtn.addEventListener('click', () => {
        try {
            urm.reset();
            
            // Converter entrada de registradores iniciais
            const regValues = initialRegisters.value
                .split(',')
                .map(val => parseInt(val.trim()) || 0);
            
            // Adicionar instruções
            const lines = urmCode.value.split('\n');
            lines.forEach(line => {
                if (line.trim() && !line.trim().startsWith('//')) {
                    urm.addInstruction(line);
                }
            });
            
            urm.compile(regValues);
            updateRegistersDisplay();
            updateMachineState();
            
            alert('Programa compilado com sucesso!');
        } catch (error) {
            alert(`Erro na compilação: ${error.message}`);
        }
    });

    // Executar passo a passo
    stepBtn.addEventListener('click', () => {
        try {
            const result = urm.executeStep();
            updateRegistersDisplay();
            updateExecutionHistory();
            updateMachineState();
            
            if (result.done) {
                if (result.error) {
                    alert(`Execução terminada com erro: ${result.error}`);
                } else {
                    alert('Execução concluída com sucesso!');
                }
            }
        } catch (error) {
            alert(`Erro na execução: ${error.message}`);
        }
    });

    // Executar tudo
    runBtn.addEventListener('click', () => {
        try {
            if (urm.state !== 'compiled') {
                throw new Error('Compile o programa primeiro');
            }
            
            urm.state = 'running';
            updateMachineState();
            
            let result;
            do {
                result = urm.executeStep();
                updateRegistersDisplay();
                updateExecutionHistory();
                updateMachineState();
            } while (!result.done);
            
            if (result.error) {
                alert(`Execução terminada com erro: ${result.error}`);
            } else {
                alert('Execução concluída com sucesso!');
            }
        } catch (error) {
            alert(`Erro na execução: ${error.message}`);
        }
    });

    // Resetar máquina
    resetBtn.addEventListener('click', () => {
        urm.reset();
        updateRegistersDisplay();
        updateExecutionHistory();
        updateMachineState();
        alert('Máquina reiniciada');
    });

    // Inicializar interface
    updateRegistersDisplay();
    updateMachineState();
});