document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos da interface
    const urmCode = document.getElementById('urm-code');
    const initialRegisters = document.getElementById('initial-registers');
    const registersDisplay = document.getElementById('registers-display');
    const stateDisplay = document.getElementById('state');
    const nextInstruction = document.getElementById('next-instruction');
    const historyDisplay = document.getElementById('execution-history');
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
            "// Soma R2 + R3 → R1",
            "J(3,2,6)  // Se R3 = R2, salta para instrução 6 (fim)",
            "S(1)      // Incrementa R1 (resultado)",
            "S(3)      // Incrementa R3 (contador)",
            "J(1,1,1)  // Salta incondicionalmente para instrução 1",
            "Z(3)      // Reset do contador (opcional)"
        ],
        multiplicacao: [
            "// Multiplicação R2 * R3 → R1",
            "Z(4)      // Contador externo = 0",
            "J(3,4,9)  // Se R3 = R4, salta para fim",
            "Z(5)      // Contador interno = 0",
            "J(2,5,8)  // Se R2 = R5, salta para passo 8",
            "S(1)      // Incrementa resultado",
            "S(5)      // Incrementa contador interno",
            "J(1,1,4)  // Volta para instrução 4",
            "S(4)      // Incrementa contador externo",
            "J(1,1,2)  // Volta para instrução 2"
        ],
        fatorial: [
            "// Fatorial R2! → R1",
            "T(2,3)    // Copia R2 para R3 (contador)",
            "S(1)      // R1 = 1 (inicializa resultado)",
            "J(3,1,9)  // Se contador = 1, salta para fim",
            "T(1,4)    // Salva valor atual de R1 em R4",
            "Z(1)      // Zera R1 para multiplicação",
            "J(4,5,9)  // Se R4 = R5 (sempre falso), salta para fim (loop de multiplicação)",
            "S(1)      // Adiciona R3 ao resultado (R1 += R3)",
            "S(5)      // Incrementa contador de multiplicação",
            "J(5,4,12) // Se contador = valor original, termina multiplicação",
            "J(1,1,6)  // Continua multiplicação",
            "Z(5)      // Reseta contador de multiplicação",
            "S(3, -1)  // Decrementa contador principal (pseudo-instrução)",
            "J(1,1,3)  // Volta para instrução 3"
        ],
        fibonacci: [
            "// Fibonacci (n-ésimo termo em R1)",
            "Z(1)      // F(0) = 0",
            "S(1)      // F(1) = 1",
            "T(1,2)    // Move para R2 (F(n-1))",
            "Z(1)      // Prepara para calcular próximo",
            "S(3)      // Incrementa contador",
            "J(4,3,10) // Se atingiu n, termina",
            "T(2,5)    // Salva F(n-1)",
            "S(1)      // F(n) = F(n-1) + F(n-2)",
            "T(5,2)    // Atualiza F(n-1)",
            "J(1,1,4)  // Volta para instrução 4"
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