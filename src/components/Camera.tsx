import React, { useState, useEffect, useRef } from 'react';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { Button, StyleSheet, Text, View, TouchableOpacity, Alert, Linking } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Renderer } from 'expo-three';
import { Asset } from 'expo-asset'; // Importation pour gérer les fichiers locaux
import { ExpoWebGLRenderingContext } from 'expo-gl';

const videoFiles = [
    'video.mp4',
    'video - Copie.mp4',
    'video - Copie (2).mp4',
    'video - Copie (3).mp4'
];

const Camera = () => {
    const [facing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [modelLoaded, setModelLoaded] = useState<boolean>(false);
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);

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

    const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
        const renderer = new Renderer({ gl });
        renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000);
        camera.position.set(0, 0, 2);

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 4);
        scene.add(light);

        const loader = new GLTFLoader();

        const modelAsset = Asset.fromModule(require('../../assets/model4.glb'));

        await modelAsset.downloadAsync();

        loader.load(
            modelAsset.localUri || '',
            (gltf) => {
                const model = gltf.scene;
                scene.add(model);

                const mixer = new THREE.AnimationMixer(model);
                mixer.clipAction(gltf.animations[0]).play();
                mixerRef.current = mixer;

                model.position.set(0, -2, -2);
                model.scale.set(0.5, 0.5, 0.5);

                setModelLoaded(true);
            },
            undefined,
            (error) => {
                console.error('Erreur lors du chargement du modèle :', error);
            }
        );

        const clock = new THREE.Clock();

        const render = () => {
            const delta = clock.getDelta();
            if (mixerRef.current) mixerRef.current.update(delta);

            renderer.render(scene, camera);
            gl.endFrameEXP();
            requestAnimationFrame(render);
        };

        render();
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
        <View style={styles.container}>
            <View style={styles.cameraContainer}>
                <CameraView style={styles.camera} facing={facing} />
                <View style={styles.gifContainer}>
                    {isVideoPlaying ? (
                        <Text style={styles.playingMessage}>Lecture vidéo en cours...</Text>
                    ) : (
                        <GLView style={styles.glView} onContextCreate={onContextCreate} />
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
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
        width: 500,
        height: 500,
    },
    playingMessage: {
        fontSize: 18,
        color: 'red',
    },
    glView: {
        width: 500,
        height: 500,
    },
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
});

export default Camera;