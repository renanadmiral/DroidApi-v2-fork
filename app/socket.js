const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Usamos um Map para armazenar os dispositivos móveis para acesso rápido por ID
let mobileDevices = new Map();

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    // Mapeamento de eventos para seus manipuladores correspondentes
    const eventHandlers = {
        'MobileIdentify': handleMobileIdentify,
        'PcIdentify': handlePcIdentify,
        'StartRecord': handleStartRecord,
        'StopRecord': handleStopRecord,
        'RecordingStatusUpdate': handleRecordingStatusUpdate,
    };

    wss.on('connection', (ws) => {
        ws.id = uuidv4();
        ws.isComputer = false;

        ws.on('message', (data) => {
            handleIncomingMessage(ws, data);
        });

        ws.on('close', () => {
            handleDisconnection(ws);
        });
    });

    /**
     * Manipula mensagens recebidas e despacha para o evento apropriado.
     */
    function handleIncomingMessage(ws, data) {
        let message;
        try {
            message = JSON.parse(data);
        } catch (err) {
            console.error('JSON inválido: ', data);
            return;
        }

        const event = message.event;
        const eventData = message.data;

        const handler = eventHandlers[event];
        if (handler) {
            handler(ws, eventData);
        } else {
            console.warn('Evento desconhecido:', event);
        }
    }

    /**
     * Manipula a identificação de um dispositivo móvel.
     */
    function handleMobileIdentify(ws, deviceModel) {
        mobileDevices.set(ws.id, {
            id: ws.id,
            deviceModel: deviceModel,
            recording: false,
            ws: ws,
        });
        sendMessage(ws, 'message', 'Seu dispositivo: ' + deviceModel);
        broadcastToComputers('ConnectedDevices', getMobileDevicesData());
    }

    /**
     * Manipula a identificação de um computador.
     */
    function handlePcIdentify(ws) {
        ws.isComputer = true;
        sendMessage(ws, 'ConnectedDevices', getMobileDevicesData());
    }

    /**
     * Envia o comando de iniciar gravação para os dispositivos móveis selecionados.
     */
    function handleStartRecord(ws, deviceIds) {
        sendRecordCommandToDevices(deviceIds, 'MobileStartRecord');
    }

    /**
     * Envia o comando de parar gravação para os dispositivos móveis selecionados.
     */
    function handleStopRecord(ws, deviceIds) {
        sendRecordCommandToDevices(deviceIds, 'MobileStopRecord');
    }

    /**
     * Envia comandos de gravação para dispositivos sem atualizar o status de gravação.
     */
    function sendRecordCommandToDevices(deviceIds, mobileEvent) {
        // Recupera dispositivos válidos de forma eficiente usando o Map
        const devicesToUpdate = deviceIds.map((id) => mobileDevices.get(id)).filter(Boolean);

        // Pré-serializa a mensagem fora do loop
        const message = JSON.stringify({ event: mobileEvent });

        // Envia mensagens para os dispositivos quase simultaneamente
        devicesToUpdate.forEach((device) => {
            device.ws.send(message);
        });
    }

    /**
     * Manipula atualizações de status de gravação dos dispositivos móveis.
     */
    function handleRecordingStatusUpdate(ws, data) {
        // 'data' deve incluir o novo status de gravação
        const { recording } = data;

        const device = mobileDevices.get(ws.id);
        if (device) {
            device.recording = recording;
            broadcastToComputers('ConnectedDevices', getMobileDevicesData());
        } else {
            console.warn(`Dispositivo com id ${ws.id} não encontrado no Map mobileDevices`);
        }
    }

    /**
     * Manipula a desconexão de um cliente.
     */
    function handleDisconnection(ws) {
        if (mobileDevices.has(ws.id)) {
            mobileDevices.delete(ws.id);
            broadcastToComputers('ConnectedDevices', getMobileDevicesData());
        }
    }

    /**
     * Envia uma mensagem formatada para um cliente específico.
     */
    function sendMessage(ws, event, data) {
        const message = JSON.stringify({ event, data });
        ws.send(message);
    }

    /**
     * Envia uma mensagem para todos os computadores conectados.
     */
    function broadcastToComputers(event, data) {
        const message = JSON.stringify({ event, data });
        wss.clients.forEach((client) => {
            if (client.isComputer && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    /**
     * Obtém os dados dos dispositivos móveis sem o objeto WebSocket.
     */
    function getMobileDevicesData() {
        return Array.from(mobileDevices.values()).map(({ id, deviceModel, recording }) => ({
            id,
            deviceModel,
            recording,
        }));
    }

    return wss;
}

module.exports = setupWebSocket;