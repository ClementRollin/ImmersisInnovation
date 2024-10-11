const WebSocket = require('ws');
const { exec } = require('child_process');
const path = require('path');

const wss = new WebSocket.Server({ port: 8085 });

wss.on('connection', function connection(ws) {
    console.log('Un appareil s\'est connecté');

    ws.on('message', function incoming(message) {

        let data;
        try {
            data = JSON.parse(message);
        } catch (error) {
            console.error('Erreur de parsing JSON:', error);
            return;
        }

        if (data.action === 'play-video') {
            console.log('Lancement de la vidéo:', data.videoPath);

            const videoPath = path.resolve('C:/MYDIGITALSCHOOL/1. Cours/2024-2025/COURS/Starter Pack - umabao.fr/App/immersis/immersis/assets/videos', data.videoPath);

            ws.send(JSON.stringify({ action: 'video-started', video: data.videoPath }));

            exec(`"C:\\Program Files\\VideoLAN\\VLC\\vlc.exe" --fullscreen --play-and-exit --video-x=1920 --video-y=0 "${videoPath}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Erreur lors du lancement de la vidéo: ${error.message}`);
                    return;
                }
                console.log('Vidéo terminée et VLC fermé');
                ws.send(JSON.stringify({ action: 'video-ended' }));
            });
        } else {
            console.log('Action non reconnue:', data.action);
        }
    });

    ws.send(JSON.stringify({ message: 'Bienvenue, vous êtes connecté au serveur WebSocket' }));
});

console.log('Serveur WebSocket démarré sur le port', wss.options.port);