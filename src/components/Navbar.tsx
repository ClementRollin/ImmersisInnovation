import { View, StyleSheet, Image } from "react-native";

const Navbar = () => {

    return (
        <View style={styles.navbar}>
            <Image
                source={require('../../assets/logoUma.png')} // Assurez-vous que le chemin est correct
                style={styles.logo}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    navbar: {
        width: '100%',
        height: 130,
        position: 'absolute',
        top: 0,
        left: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1, // Assure que la navbar est au-dessus des autres éléments
        backgroundColor: '#000' // Si nécessaire, ajouter une couleur de fond
    },
    logo: {
        marginTop: 50,
        width: 200,
        height: 100,
        resizeMode: 'contain',
    },
});

export default Navbar;
