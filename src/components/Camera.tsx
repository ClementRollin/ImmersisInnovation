import React, { useState, useEffect } from 'react';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { Button, StyleSheet, Text, View, Image, TouchableOpacity, Alert, Linking } from 'react-native';

const videoFiles = [
    'video.mp4',
    'video - Copie.mp4'
];

const Camera = () => {
    const [facing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    useEffect(() => {
        const ws = new WebSocket('ws://10.26.129.176:8085');

        ws.onopen = () => {
            console.log('Connexion WebSocket établie');
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.action === 'video-started') {
                setIsVideoPlaying(true);
            }
            if (message.action === 'video-ended') {
                setIsVideoPlaying(false);

                if (currentVideoIndex === videoFiles.length - 1) {
                    Alert.alert(
                        "Merci pour votre participation !",
                        "Merci d'avoir participé à ce repas ! Nous vous invitons à laisser un avis sur notre page Google.",
                        [
                            {
                                text: "Laisser un avis",
                                onPress: () => Linking.openURL('https://umabao.fr/')
                            },
                            { text: "Fermer", style: "cancel" }
                        ]
                    );
                } else {
                    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videoFiles.length);
                }
            }
        };

        ws.onerror = (error) => {
            console.error('Erreur WebSocket :', error);
        };

        ws.onclose = () => {
            console.log('Connexion WebSocket fermée');
        };

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, [currentVideoIndex]);

    const startVideoOnTV = () => {
        if (isVideoPlaying) {
            console.log('Vidéo déjà en cours de lecture');
            return;
        }

        if (socket && socket.readyState === WebSocket.OPEN) {
            const videoPath = videoFiles[currentVideoIndex];
            socket.send(JSON.stringify({ action: 'play-video', videoPath }));
        } else {
            console.error('WebSocket non connectée ou fermée');
        }
    };

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="Grant Permission" />
            </View>
        );
    }

    return (
        <View style={styles.cameraContainer}>
            <CameraView style={styles.camera} facing={facing} />
            <View style={styles.gifContainer}>
                {isVideoPlaying ? (
                    <Text style={styles.playingMessage}>Lecture vidéo en cours...</Text>
                ) : (
                    <TouchableOpacity onPress={startVideoOnTV}>
                        <Image source={require('../../assets/pres-ok-unscreen.gif')} style={styles.gif} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
        fontSize: 18,
    },
    cameraContainer: {
        flex: 1,
        marginTop: 130,
    },
    camera: {
        flex: 1,
    },
    gifContainer: {
        position: 'absolute',
        bottom: 150,
        alignItems: 'center',
        width: '100%',
    },
    gif: {
        width: 200,
        height: 200,
    },
    playingMessage: {
        fontSize: 18,
        color: 'red',
    },
});

export default Camera;