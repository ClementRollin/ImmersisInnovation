import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import Navbar from "./src/components/Navbar";
import Camera from "./src/components/Camera";

export default function App() {
    return (
        <View style={styles.container}>
            <Navbar />
            <Camera />
            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
